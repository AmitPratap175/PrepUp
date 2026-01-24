import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { UPSCQuizInterface } from "@/components/UPSCQuizInterface";
import { LocalResultView } from "@/components/local-result-view";
import { Loader2, AlertCircle, BookOpen, Clock, Brain, CheckCircle2, List, RotateCcw, Trophy, Eye, Download } from 'lucide-react';
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

interface StoredTestResult {
    score: number;
    total: number;
    accuracy: number;
    date: string;
    answers: UserAnswer[];
}

const ChapterwiseQuizPage: React.FC = () => {
    const [, setLocation] = useLocation();

    // State for multiple quizzes
    const [availableTests, setAvailableTests] = useState<PracticeTest[]>([]);
    const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

    // Derived state for current active test
    const test = availableTests.find(t => t.id === selectedTestId) || null;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const [finalAnswers, setFinalAnswers] = useState<UserAnswer[]>([]);

    const [revisionMode, setRevisionMode] = useState(false);
    const [revisionCount, setRevisionCount] = useState(0);
    const [latestResult, setLatestResult] = useState<StoredTestResult | null>(null);

    const [completedChapters, setCompletedChapters] = useState<string[]>([]);
    const [submittingCompletion, setSubmittingCompletion] = useState(false);

    useEffect(() => {
        fetchQuizzes();
        fetchCompletionStatus();
    }, []);

    const fetchCompletionStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/chapter-progress/', {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCompletedChapters(data);
            }
        } catch (e) {
            console.error("Failed to fetch completion status", e);
        }
    };

    const toggleCompletion = async (testId: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        setSubmittingCompletion(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return; // Should likely prompt login
            const res = await fetch('/api/chapter-progress/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    chapter_id: testId,
                    is_completed: !currentStatus
                })
            });

            if (res.ok) {
                if (!currentStatus) {
                    setCompletedChapters(prev => [...prev, testId]);
                } else {
                    setCompletedChapters(prev => prev.filter(id => id !== testId));
                }
            }
        } catch (e) {
            console.error("Failed to toggle completion", e);
        } finally {
            setSubmittingCompletion(false);
        }
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        if (!test) return;
        setIsExporting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Not authenticated");

            const response = await fetch('/api/chapterwise-quiz/export-pdf/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chapter_id: test.id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate PDF");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${test.title.replace(/\s+/g, '_')}_questions.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Failed to export PDF:", error);
            alert("Failed to export PDF. Please ensure the backend has LaTeX installed.");
        } finally {
            setIsExporting(false);
        }
    };

    // ... (rest of the component)




    useEffect(() => {
        if (selectedTestId) {
            updateRevisionCount(selectedTestId);
            loadLatestResult(selectedTestId);
        }
    }, [selectedTestId]);

    const getRevisionKey = (testId: string) => `chapterwise_revision_${testId}`;
    const getResultKey = (testId: string) => `chapterwise_result_${testId}`;

    const updateRevisionCount = (testId: string) => {
        try {
            const saved = localStorage.getItem(getRevisionKey(testId));
            if (saved) {
                const ids = JSON.parse(saved);
                setRevisionCount(ids.length);
            } else {
                setRevisionCount(0);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadLatestResult = (testId: string) => {
        try {
            setLatestResult(null); // clear prev
            const saved = localStorage.getItem(getResultKey(testId));
            if (saved) {
                setLatestResult(JSON.parse(saved));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchQuizzes = async () => {
        try {
            const response = await fetch('/api/chapterwise-quiz/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const data = await response.json();

                let quizzes: QuizData[] = [];
                if (Array.isArray(data)) {
                    quizzes = data;
                } else {
                    quizzes = [data]; // Handle legacy single object if needed
                }

                const convertedTests = quizzes.map((q, idx) => convertToPracticeTest(q, idx));
                setAvailableTests(convertedTests);
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

    const convertToPracticeTest = (data: QuizData, index: number): PracticeTest => {
        // Generating stable ID based on title
        const safeTitle = data.title ? data.title.replace(/[^a-zA-Z0-9]/g, '') : `Quiz${index}`;
        const testId = `cw_${index}_${safeTitle}`;

        const questions: any[] = data.questions.map((q: any, idx) => {
            const correctOptionIndex = q.answerOptions.findIndex((o: any) => o.isCorrect);
            const options = q.answerOptions.map((opt: any, i: number) => ({
                label: String.fromCharCode(97 + i),
                option_text: opt.text,
                data_option: String.fromCharCode(97 + i),
                explanation: opt.rationale,
                is_correct: opt.isCorrect
            }));

            // Use persistent persistent ID if available (added by backend script)
            // Fallback to generated ID if missing
            const persistentId = q.qid || q.id;
            const finalId = persistentId || `${testId}_q${idx}`;

            return {
                id: finalId,
                qid: finalId,
                index: idx,
                question_text: q.question,
                options: options,
                correct_answer: String.fromCharCode(97 + correctOptionIndex),
                explanation: q.answerOptions[correctOptionIndex]?.rationale || "",
                status: 'active',
                created_at: new Date().toISOString()
            };
        });

        return {
            id: testId,
            title: data.title || `Chapter ${index + 1}`,
            // description: "Chapterwise Practice Set", // Removed to fix lint error if not in type
            examType: "upsc",
            subject: "General Studies",
            duration: Math.ceil(questions.length * 1.5),
            totalQuestions: questions.length,
            questions: questions,
            is_full_length: false,
            created_at: new Date().toISOString()
        } as PracticeTest;
    };

    const handleSelectQuiz = (testId: string) => {
        setSelectedTestId(testId);
        setQuizStarted(false);
        setQuizFinished(false);
        setRevisionMode(false);
    };

    const handleQuizSubmit = (answers: UserAnswer[]) => {
        if (!test) return;
        setFinalAnswers(answers);
        setQuizFinished(true);
        setQuizStarted(false);

        const incorrectIndices: number[] = [];
        let correctCount = 0;
        const questions = test.questions as any[];

        if (questions) {
            questions.forEach((q, idx) => {
                const userAns = answers.find(a => a.questionId === q.id || a.questionId === q.qid);
                if (userAns && userAns.selectedAnswer === q.correct_answer) {
                    correctCount++;
                } else {
                    incorrectIndices.push(idx);
                }
            });
        }

        try {
            const key = getRevisionKey(test.id);
            const existingRaw = localStorage.getItem(key);
            let existing: number[] = existingRaw ? JSON.parse(existingRaw) : [];
            const merged = Array.from(new Set([...existing, ...incorrectIndices]));
            localStorage.setItem(key, JSON.stringify(merged));
            updateRevisionCount(test.id);
        } catch (e) {
            console.error("Failed to save revision", e);
        }

        if (!revisionMode) {
            const result: StoredTestResult = {
                score: correctCount,
                total: test.totalQuestions,
                accuracy: (correctCount / test.totalQuestions) * 100,
                date: new Date().toISOString(),
                answers: answers
            };
            localStorage.setItem(getResultKey(test.id), JSON.stringify(result));
            setLatestResult(result);
        }
    };

    const startRevision = () => {
        if (!test) return;
        try {
            const saved = localStorage.getItem(getRevisionKey(test.id));
            if (saved) {
                const ids: number[] = JSON.parse(saved);
                const allQuestions = test.questions as any[];
                const revisionQuestions = allQuestions.filter((_, idx) => ids.includes(idx));
                if (revisionQuestions.length === 0) {
                    alert("No revision questions found!");
                    return;
                }
                const revisionTest = {
                    ...test,
                    title: `Revision: ${test.title}`,
                    questions: revisionQuestions,
                    totalQuestions: revisionQuestions.length,
                    duration: Math.ceil(revisionQuestions.length * 2)
                };

                // We are essentially starting a new "temporary" test session.
                // We rely on 'test' being derived from selectedTestId, 
                // but we also have 'revisionMode' to alter the logic.
                setRevisionMode(true);
                setQuizStarted(true);
                setCurrentQuestionIndex(0);
            }
        } catch (e) { console.error(e); }
    };

    const handleExit = () => {
        if (quizStarted || quizFinished) {
            setQuizStarted(false);
            setQuizFinished(false);
            setRevisionMode(false);
        } else if (selectedTestId) {
            setSelectedTestId(null);
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

    // Active test derived logic for Revision Mode override
    const activeTest = revisionMode && test ? {
        ...test,
        title: `Revision: ${test.title}`,
        questions: (() => {
            const saved = localStorage.getItem(getRevisionKey(test.id));
            const ids = saved ? JSON.parse(saved) : [];
            return (test.questions as any[]).filter((_, i) => ids.includes(i));
        })(),
    } : test;

    if (revisionMode && activeTest) {
        // Re-calculate totals for the active revision test
        activeTest.totalQuestions = activeTest.questions.length;
        activeTest.duration = Math.ceil(activeTest.totalQuestions * 2);
    }

    if (quizFinished && activeTest) {
        return (
            <LocalResultView
                test={activeTest}
                userAnswers={finalAnswers}
                onExit={handleExit}
                onRetake={() => {
                    setQuizFinished(false);
                    setQuizStarted(true);
                    setCurrentQuestionIndex(0);
                    setFinalAnswers([]);
                }}
            />
        );
    }

    if (quizStarted && activeTest) {
        return (
            <UPSCQuizInterface
                test={activeTest}
                onExit={handleExit}
                onSubmit={handleQuizSubmit}
                onProgressUpdate={() => { }}
                navigateToQuestion={setCurrentQuestionIndex}
                currentQuestionIndex={currentQuestionIndex}
                duration={activeTest.duration * 60}
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

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!selectedTestId ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableTests.map((t, idx) => {
                                const isCompleted = completedChapters.includes(t.id);
                                return (
                                    <Card key={t.id}
                                        className={`hover-elevate cursor-pointer transition-all ${isCompleted ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : ''}`}
                                        onClick={() => handleSelectQuiz(t.id)}
                                    >
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between text-lg">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className={`h-5 w-5 ${isCompleted ? 'text-green-600' : 'text-primary'}`} />
                                                    {t.title}
                                                </div>
                                                {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                            </CardTitle>
                                            <CardDescription>{t.totalQuestions} Questions • {t.duration} mins</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button className="w-full" variant={isCompleted ? "outline" : "secondary"}>
                                                {isCompleted ? "Completed" : "View Chapter"}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {availableTests.length === 0 && !loading && !error && (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    No chapters available. Please verify the backend data location!
                                </div>
                            )}
                        </div>
                    ) : test && (
                        <Tabs defaultValue="practice" className="w-full">
                            <Button variant="ghost" onClick={() => setSelectedTestId(null)} className="mb-4 pl-0 hover:bg-transparent hover:underline text-muted-foreground">
                                ← Back to Chapters
                            </Button>

                            <TabsList className="mb-8">
                                <TabsTrigger value="practice">Practice</TabsTrigger>
                                <TabsTrigger value="revision">Revision</TabsTrigger>
                            </TabsList>

                            <TabsContent value="practice" className="space-y-6">
                                <section>
                                    <h2 className="text-2xl font-bold mb-4">{test.title}</h2>
                                    <Card className="hover-elevate transition-all border-primary/20 bg-primary/5">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-xl flex items-center gap-2">
                                                        <BookOpen className="h-5 w-5 text-primary" />
                                                        Overview
                                                    </CardTitle>
                                                    {/* Description removed due to type issue, used generic text instead or custom prop if extended */}
                                                    <CardDescription>Comprehensive Chapterwise Practice</CardDescription>
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

                                            {latestResult && (
                                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Trophy className="h-6 w-6 text-yellow-600" />
                                                        <div>
                                                            <p className="font-semibold text-green-800 dark:text-green-300">Last Attempt Result</p>
                                                            <p className="text-sm text-green-700 dark:text-green-400">
                                                                Score: {latestResult.score}/{latestResult.total} ({latestResult.accuracy.toFixed(0)}%)
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => { setFinalAnswers(latestResult.answers); setQuizFinished(true); }} className="gap-2">
                                                        <Eye className="h-4 w-4" /> View Details
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="flex gap-4">
                                                <Button size="lg" className="w-full sm:w-auto" onClick={() => setQuizStarted(true)}>
                                                    {latestResult ? "Retake Quiz" : "Start Quiz Now"}
                                                </Button>

                                                <Button
                                                    size="lg"
                                                    variant="outline"
                                                    className="w-full sm:w-auto"
                                                    onClick={handleExportPDF}
                                                    disabled={isExporting}
                                                >
                                                    {isExporting ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Generating PDF...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Export PDF
                                                        </>
                                                    )}
                                                </Button>

                                                <Button
                                                    size="lg"
                                                    variant="outline"
                                                    className={`w-full sm:w-auto ${completedChapters.includes(test.id) ? 'text-green-600 border-green-200 hover:bg-green-50' : ''}`}
                                                    onClick={(e) => toggleCompletion(test.id, completedChapters.includes(test.id), e)}
                                                    disabled={submittingCompletion}
                                                >
                                                    {submittingCompletion ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                                        completedChapters.includes(test.id) ?
                                                            <> <CheckCircle2 className="mr-2 h-4 w-4" /> Marked as Completed </> :
                                                            "Mark as Completed"
                                                    }
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
                                            Revisit questions you answered incorrectly in this chapter.
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
                                                <p>All caught up! No incorrect questions pending revision for this chapter.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </main >
            <AppFooter />
        </div >
    );
};

export default ChapterwiseQuizPage;
