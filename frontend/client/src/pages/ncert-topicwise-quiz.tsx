import React, { useState, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from 'wouter';
import { UPSCQuizInterface } from "@/components/UPSCQuizInterface";
import { LocalResultView } from "@/components/local-result-view";
import { Loader2, AlertCircle, BookOpen, Clock, Brain, CheckCircle2, List, RotateCcw, Trophy, Eye, Download, ChevronDown, ChevronRight } from 'lucide-react';
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
    subject?: string;
}

// ... existing interfaces ...
interface StoredTestResult {
    score: number;
    total: number;
    accuracy: number;
    date: string;
    answers: UserAnswer[];
}

const getRevisionKey = (testId: string) => `revision_${testId}`;

const NcertTopicwiseQuizPage: React.FC = () => {
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

    // Track expanded state for each subject section
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (subject: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [subject]: !prev[subject]
        }));
    };

    useEffect(() => {
        fetchQuizzes();
        fetchCompletionStatus();
    }, []);

    // Derived state for grouping
    const groupedQuizzes = React.useMemo(() => {
        const groups: Record<string, PracticeTest[]> = {};
        availableTests.forEach(test => {
            const subj = test.subject || "General Studies";
            if (!groups[subj]) groups[subj] = [];
            groups[subj].push(test);
        });
        return groups;
    }, [availableTests]);

    // ... existing functions ...

    const convertToPracticeTest = (data: QuizData, index: number): PracticeTest => {
        // Generating stable ID based on title
        const safeTitle = data.title ? data.title.replace(/[^a-zA-Z0-9]/g, '') : `Quiz${index}`;
        const testId = `cw_${index}_${safeTitle}`;

        const questions: any[] = data.questions.map((q: any, idx) => {
            // ... existing question mapping ...
            const correctOptionIndex = q.answerOptions.findIndex((o: any) => o.isCorrect);
            const options = q.answerOptions.map((opt: any, i: number) => ({
                label: String.fromCharCode(97 + i),
                option_text: opt.text,
                data_option: String.fromCharCode(97 + i),
                explanation: opt.rationale,
                is_correct: opt.isCorrect
            }));

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

        // Heuristic to clean subject if it comes in mixed case
        let subject = data.subject || "General Studies";
        // Capitalize first letter of each word
        subject = subject.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

        return {
            id: testId,
            title: data.title || `Chapter ${index + 1}`,
            examType: "upsc",
            subject: subject,
            duration: Math.ceil(questions.length * 1.5),
            totalQuestions: questions.length,
            questions: questions,
            is_full_length: false,
            created_at: new Date().toISOString()
        } as PracticeTest;
    };

    // ... existing handlers ...
    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/ncert-quiz/');
            if (!response.ok) throw new Error('Failed to fetch quizzes');
            const data: QuizData[] = await response.json();

            const tests = data.map((quiz, index) => convertToPracticeTest(quiz, index));
            setAvailableTests(tests);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to load quizzes');
            setLoading(false);
        }
    };



    // ... existing imports

    const fetchCompletionStatus = async () => {
        try {
            const res = await apiRequest("GET", '/api/chapter-progress/');
            if (res.ok) {
                const data = await res.json();
                // Assuming data returns list of objects with chapter_id
                if (Array.isArray(data)) {
                    // Check format. If explicit chapter_id field exists
                    if (data.length > 0 && data[0].chapter_id) {
                        setCompletedChapters(data.map((c: any) => c.chapter_id));
                    } else {
                        // Fallback if it returns list of strings
                        setCompletedChapters(data);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch progress", e);
        }
    };

    // ... existing functions

    const toggleCompletion = async (testId: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        setSubmittingCompletion(true);
        const newStatus = !currentStatus;
        if (newStatus) setCompletedChapters(prev => [...prev, testId]);
        else setCompletedChapters(prev => prev.filter(id => id !== testId));

        try {
            await apiRequest("POST", '/api/chapter-progress/', { chapter_id: testId, is_completed: newStatus });
        } catch (err) {
            if (newStatus) setCompletedChapters(prev => prev.filter(id => id !== testId));
            else setCompletedChapters(prev => [...prev, testId]);
        } finally {
            setSubmittingCompletion(false);
        }
    };

    const handleSelectQuiz = (testId: string) => {
        setSelectedTestId(testId);
        setQuizStarted(false);
        setQuizFinished(false);
        setRevisionMode(false);
        setLatestResult(null);

        const stored = localStorage.getItem(`upsc_result_${testId}`);
        if (stored) {
            setLatestResult(JSON.parse(stored));
        }

        // Calculate revision count
        const revKey = getRevisionKey(testId);
        const savedRev = localStorage.getItem(revKey);
        setRevisionCount(savedRev ? JSON.parse(savedRev).length : 0);
    };

    const handleExit = () => {
        setQuizStarted(false);
        setQuizFinished(false);
        setSelectedTestId(null);
        setLatestResult(null);
    };

    const handleQuizSubmit = (answers: UserAnswer[]) => {
        setFinalAnswers(answers);
        setQuizFinished(true);
        setQuizStarted(false);

        if (activeTest) {
            let score = 0;
            const incorrectIndices: number[] = [];

            answers.forEach(ans => {
                const questions = activeTest.questions as any[];
                const q = questions.find(q => q.id === ans.questionId);
                // Note: activeTest.questions might be filtered in revision mode.
                // But we need original index for revision key? 
                // Wait, revision key stores indices of ORIGINAL questions list.
                // If we are in revision mode, "index" prop on question should be original index.
                // Let's rely on question.index if available.

                if (q) {
                    if (q.correct_answer === ans.selectedAnswer) {
                        score++;
                    } else {
                        if (q.index !== undefined) incorrectIndices.push(q.index);
                    }
                }
            });

            const result: StoredTestResult = {
                score,
                total: activeTest.totalQuestions,
                accuracy: activeTest.totalQuestions > 0 ? (score / activeTest.totalQuestions) * 100 : 0,
                date: new Date().toISOString(),
                answers
            };

            localStorage.setItem(`upsc_result_${activeTest.id}`, JSON.stringify(result));
            setLatestResult(result);

            // Update revision list
            // If manual revision mode, we might remove correct ones from list.
            // Implemenation detail: update revision store.
            const revKey = getRevisionKey(activeTest.id);
            // If strictly adding incorrect ones:
            if (incorrectIndices.length > 0) {
                const existing = JSON.parse(localStorage.getItem(revKey) || '[]');
                const combined = Array.from(new Set([...existing, ...incorrectIndices]));
                localStorage.setItem(revKey, JSON.stringify(combined));
            }

            // Auto-mark completed if score > 0
            if (!completedChapters.includes(activeTest.id)) {
                // For now user manually marks, or we can auto mark.
                // toggleCompletion(activeTest.id, false, { stopPropagation: () => {} } as any);
            }
            // toggleCompletion(activeTest.id, false, { stopPropagation: () => {} } as any);
        }
    }


    const startRevision = () => {
        setRevisionMode(true);
        setQuizStarted(true);
    };



    const [isExporting, setIsExporting] = useState(false);
    const handleExportPDF = async () => {
        if (!activeTest) return;
        setIsExporting(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Not authenticated");

            const res = await fetch('/api/chapterwise-quiz/export-pdf/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ chapter_id: activeTest.id })
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${activeTest.title}.pdf`;
                a.click();
            } else {
                throw new Error("Export failed");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to export PDF");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        // ... existing loading ...
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // ... existing activeTest/result logic ...

    // Copy the active test logic from original file here or ensure it falls through
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
        activeTest.totalQuestions = (activeTest.questions as any[]).length;
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
                        <h1 className="text-3xl font-bold tracking-tight mb-2">NCERT Topicwise Practice</h1>
                        <p className="text-xl text-muted-foreground">
                            Master your NCERT subjects with our topicwise question banks.
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
                        <div className="space-y-10">
                            {Object.entries(groupedQuizzes).sort().map(([subject, tests]) => (
                                <section key={subject} className="space-y-4">
                                    <div
                                        className="flex items-center gap-2 pb-2 border-b border-border/60 cursor-pointer hover:bg-accent/5 transition-colors rounded-t-lg p-2"
                                        onClick={() => toggleSection(subject)}
                                    >
                                        {!expandedSections[subject] ? (
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <Badge variant="outline" className="text-lg font-semibold px-3 py-1 bg-primary/5 border-primary/20 text-primary">
                                            {subject}
                                        </Badge>
                                        <span className="text-muted-foreground text-sm font-medium">({tests.length} chapters)</span>
                                    </div>

                                    {expandedSections[subject] && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200 fade-in-50">
                                            {tests.map((t) => {
                                                const isCompleted = completedChapters.includes(t.id);
                                                return (
                                                    <Card key={t.id}
                                                        className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full border-t-4 ${isCompleted ? 'border-t-green-500 bg-green-50/30 dark:bg-green-900/5' : 'border-t-primary/20 hover:border-t-primary'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent section toggle when clicking card
                                                            handleSelectQuiz(t.id);
                                                        }}
                                                    >
                                                        <CardHeader className="flex-none pb-2">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                                                                        <BookOpen className="h-5 w-5" />
                                                                    </div>
                                                                    <div>
                                                                        <CardTitle className="text-lg font-bold leading-tight mb-1 line-clamp-2">
                                                                            {t.title}
                                                                        </CardTitle>
                                                                        <CardDescription className="flex items-center gap-2 text-xs font-medium">
                                                                            <span className="flex items-center gap-1"><List className="h-3 w-3" /> {t.totalQuestions} Qs</span>
                                                                            <span>•</span>
                                                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t.duration}m</span>
                                                                        </CardDescription>
                                                                    </div>
                                                                </div>
                                                                {isCompleted && (
                                                                    <div className="shrink-0 text-green-600 dark:text-green-400 animate-in zoom-in spin-in-12 duration-300">
                                                                        <CheckCircle2 className="h-6 w-6" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="flex-grow flex flex-col justify-end pt-2">
                                                            <div className="w-full h-px bg-border/50 mb-4" />
                                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                                <Button
                                                                    className={`w-full font-semibold shadow-sm ${isCompleted ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200' : ''}`}
                                                                    variant={isCompleted ? "default" : "secondary"}
                                                                // onClick is handled by parent Card
                                                                >
                                                                    {isCompleted ? "Review Completed" : "Start Chapter"}
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            ))}

                            {availableTests.length === 0 && !loading && !error && (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    No chapters available. Please verify the backend data location!
                                </div>
                            )}
                        </div>
                    ) : test && (
                        // ... existing Tabs/Quiz View code ...
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
                                                    <CardDescription>Comprehensive NCERT Topicwise Practice</CardDescription>
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
                    )
                    }
                </div>
            </main >
            <AppFooter />
        </div >
    );
};

export default NcertTopicwiseQuizPage;
