import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { UPSCQuizInterface } from "@/components/UPSCQuizInterface";
import { LocalResultView } from "@/components/local-result-view";
import { Loader2, AlertCircle, BookOpen, Clock, Brain, CheckCircle2, List, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import type { PracticeTest, UserAnswer } from "@shared/schema";

interface QuizOption {
    text: string;
    isCorrect: boolean;
    rationale: string;
}

interface QuizQuestion {
    question: string;
    answerOptions: QuizOption[];
    hint: string;
}

interface QuizData {
    title: string;
    questions: QuizQuestion[];
}

const ChapterwiseQuizPage: React.FC = () => {
    const [, setLocation] = useLocation();
    const [test, setTest] = useState<PracticeTest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const [finalAnswers, setFinalAnswers] = useState<UserAnswer[]>([]);

    // Revision State
    const [revisionMode, setRevisionMode] = useState(false);
    const [revisionCount, setRevisionCount] = useState(0);

    /* 
       We use localStorage to simulate backend revision.
       Key: 'chapterwise_revision_ids' -> Array of Question Indices (since IDs are stable in static JSON)
    */

    useEffect(() => {
        fetchQuiz();
        updateRevisionCount();
    }, []);

    const updateRevisionCount = () => {
        try {
            const saved = localStorage.getItem('chapterwise_revision_ids');
            if (saved) {
                const ids = JSON.parse(saved);
                setRevisionCount(ids.length);
            }
        } catch (e) {
            console.error("Error reading revision storage", e);
        }
    };

    const fetchQuiz = async () => {
        try {
            const response = await fetch('/api/chapterwise-quiz/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const data: QuizData = await response.json();
                const convertedTest = convertToPracticeTest(data);
                setTest(convertedTest);
            } else {
                if (response.status === 401) {
                    setError("Please log in to access this quiz.");
                } else {
                    throw new Error('Failed to fetch quiz data');
                }
            }
        } catch (err) {
            console.error(err);
            setError("Could not load the chapterwise quiz.");
        } finally {
            setLoading(false);
        }
    };

    const convertToPracticeTest = (data: QuizData): PracticeTest => {
        const questions: any[] = data.questions.map((q, index) => {
            const correctOptionIndex = q.answerOptions.findIndex(o => o.isCorrect);

            const options = q.answerOptions.map((opt, i) => ({
                label: String.fromCharCode(97 + i), // a, b, c, d
                option_text: opt.text,
                data_option: String.fromCharCode(97 + i),
                explanation: opt.rationale
            }));

            return {
                id: "cw_" + index,
                qid: "cw_" + index,
                index: index, // custom field for tracking
                question_text: q.question,
                options: options,
                correct_answer: String.fromCharCode(97 + correctOptionIndex),
                explanation: q.answerOptions[correctOptionIndex]?.rationale || "",
                passage_text: null,
                status: 'active',
                created_at: new Date().toISOString()
            };
        });

        return {
            id: "chapterwise_polity",
            title: data.title || "Chapterwise Quiz",
            description: "Comprehensive Chapterwise Practice for UPSC Prelims.",
            examType: "upsc",
            subject: "Polity",
            duration: Math.ceil(questions.length * 1.5),
            totalQuestions: questions.length,
            questions: questions,
            is_full_length: false,
            created_at: new Date().toISOString()
        } as PracticeTest;
    };

    const handleQuizSubmit = (answers: UserAnswer[]) => {
        setFinalAnswers(answers);
        setQuizFinished(true);
        setQuizStarted(false);

        // Identify Incorrect Answers and save to Revision
        const incorrectIndices: number[] = [];
        const questions = test?.questions as any[];

        if (questions) {
            questions.forEach((q, idx) => {
                const userAns = answers.find(a => a.questionId === q.qid || a.questionId === q.id);
                // If wrong answer or no answer, add to revision
                if (!userAns || userAns.selectedAnswer !== q.correct_answer) {
                    incorrectIndices.push(idx);
                }
            });
        }

        // Merge with existing
        try {
            const existingRaw = localStorage.getItem('chapterwise_revision_ids');
            let existing: number[] = existingRaw ? JSON.parse(existingRaw) : [];
            // Merge unique
            const merged = Array.from(new Set([...existing, ...incorrectIndices]));
            localStorage.setItem('chapterwise_revision_ids', JSON.stringify(merged));
            updateRevisionCount();
        } catch (e) {
            console.error("Failed to save revision", e);
        }
    };

    const startRevision = () => {
        if (!test) return;

        // Filter test to only include revision questions
        try {
            const saved = localStorage.getItem('chapterwise_revision_ids');
            if (saved) {
                const ids: number[] = JSON.parse(saved);
                const allQuestions = test.questions as any[];
                const revisionQuestions = allQuestions.filter((_, idx) => ids.includes(idx));

                if (revisionQuestions.length === 0) {
                    alert("No revision questions found!");
                    return;
                }

                // Create a temporary test object for revision
                const revisionTest = {
                    ...test,
                    title: `Revision: ${test.title}`,
                    questions: revisionQuestions,
                    totalQuestions: revisionQuestions.length,
                    duration: Math.ceil(revisionQuestions.length * 2) // More time for revision
                };

                setTest(revisionTest); // Override current test with revision subset
                setRevisionMode(true);
                setQuizStarted(true);
                setCurrentQuestionIndex(0);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleExit = () => {
        if (quizStarted || quizFinished) {
            // Reload full test if we were in revision mode to reset state
            if (revisionMode) {
                window.location.reload(); // Simple way to reset state for now
            } else {
                setQuizStarted(false);
                setQuizFinished(false);
            }
        } else {
            setLocation('/upsc');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (quizFinished && test) {
        return (
            <LocalResultView
                test={test}
                userAnswers={finalAnswers}
                onExit={handleExit}
                onRetake={() => {
                    // Logic to retake same set
                    setQuizFinished(false);
                    setQuizStarted(true);
                    setCurrentQuestionIndex(0);
                    setFinalAnswers([]);
                }}
            />
        );
    }

    if (quizStarted && test) {
        return (
            <UPSCQuizInterface
                test={test}
                onExit={handleExit}
                onSubmit={handleQuizSubmit}
                onProgressUpdate={() => { }}
                navigateToQuestion={setCurrentQuestionIndex}
                currentQuestionIndex={currentQuestionIndex}
                duration={test.duration * 60}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col gap-8 max-w-5xl mx-auto">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Chapterwise Practice</h1>
                        <p className="text-xl text-muted-foreground">
                            Deep dive into specific subjects with our curated question banks.
                        </p>
                    </div>

                    {error ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : test && (
                        <Tabs defaultValue="practice" className="w-full">
                            <TabsList className="mb-8">
                                <TabsTrigger value="practice">Practice</TabsTrigger>
                                <TabsTrigger value="revision">Revision</TabsTrigger>
                            </TabsList>

                            <TabsContent value="practice" className="space-y-6">
                                <section>
                                    <h2 className="text-2xl font-bold mb-4">Available Question Banks</h2>
                                    <Card className="hover-elevate transition-all border-primary/20 bg-primary/5">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-xl flex items-center gap-2">
                                                        <BookOpen className="h-5 w-5 text-primary" />
                                                        {test.title}
                                                    </CardTitle>
                                                    <CardDescription>{test.description}</CardDescription>
                                                </div>
                                                <Badge className="bg-primary text-primary-foreground">PREMIUM</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid sm:grid-cols-3 gap-6 mb-6">
                                                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border">
                                                    <List className="h-8 w-8 text-primary" />
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Questions</p>
                                                        <p className="text-xl font-bold">{test.totalQuestions}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border">
                                                    <Clock className="h-8 w-8 text-primary" />
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Duration</p>
                                                        <p className="text-xl font-bold">{test.duration} mins</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border">
                                                    <Brain className="h-8 w-8 text-primary" />
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Subject</p>
                                                        <p className="text-xl font-bold">{test.subject}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <Button size="lg" className="w-full sm:w-auto" onClick={() => setQuizStarted(true)}>
                                                    Start Quiz Now
                                                </Button>
                                                <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={handleExit}>
                                                    Back to UPSC
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </section>
                            </TabsContent>

                            <TabsContent value="revision" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Brain className="h-5 w-5 text-primary" />
                                            Smart Revision
                                        </CardTitle>
                                        <CardDescription>
                                            Revisit questions you answered incorrectly to strengthen your concepts.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {revisionCount > 0 ? (
                                            <div className="text-center py-8">
                                                <div className="text-4xl font-bold text-primary mb-2">{revisionCount}</div>
                                                <p className="text-muted-foreground mb-6">Questions pending for review</p>
                                                <Button size="lg" onClick={startRevision} className="gap-2">
                                                    <RotateCcw className="h-4 w-4" /> Start Revision Session
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                                <p>All caught up! No incorrect questions pending revision.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </main>
            <AppFooter />
        </div>
    );
};

export default ChapterwiseQuizPage;
