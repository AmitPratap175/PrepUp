import React, { useState, useEffect } from 'react';
import Latex from 'react-latex-next';
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { Loader2, Brain, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

interface Question {
    id: string;
    qid: string;
    question_text: string;
    options: { label: string; option_text: string; data_option: string }[];
    correct_answer: string;
    explanation?: string;
    passage_text?: string;
}

interface RevisionItem {
    id: string;
    question: Question;
    subject: string;
    nextReviewDate: string;
    interval: number;
}

import { AppFooter } from "@/components/app-footer";
import { Link } from "wouter";

const UPSCRevisionPage: React.FC = () => {
    const [, setLocation] = useLocation();
    const [allRevisions, setAllRevisions] = useState<RevisionItem[]>([]);
    const [revisions, setRevisions] = useState<RevisionItem[]>([]);
    const [groupedRevisions, setGroupedRevisions] = useState<Record<string, RevisionItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);
    const [renderTrigger, setRenderTrigger] = useState(0);

    useEffect(() => {
        fetchRevisions();
    }, []);

    const fetchRevisions = async () => {
        try {
            const url = '/api/revision/';
            const response = await fetch(url, {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data: RevisionItem[] = await response.json();
                setAllRevisions(data);
                
                // Group by subject
                const grouped = data.reduce((acc, item) => {
                    const subj = item.subject || 'General';
                    if (!acc[subj]) acc[subj] = [];
                    acc[subj].push(item);
                    return acc;
                }, {} as Record<string, RevisionItem[]>);
                
                setGroupedRevisions(grouped);

                const searchParams = new URLSearchParams(window.location.search);
                const querySubject = searchParams.get('subject');
                if (querySubject && grouped[querySubject]) {
                    startRevisionForSubject(querySubject, grouped[querySubject]);
                }
            } else {
                throw new Error('Failed to fetch revisions');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load revision questions.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const startRevisionForSubject = (subject: string, subjectRevisions: RevisionItem[]) => {
        setSelectedSubject(subject);
        setRevisions(subjectRevisions);
        setCurrentIndex(0);
        setCompletedCount(0);
        setShowAnswer(false);
        setSelectedAnswer('');
    };

    const handleSubmitAnswer = async (isCorrectOverride?: boolean) => {
        if (!revisions[currentIndex]) return;

        let isCorrect = false;
        const currentQ = revisions[currentIndex].question;

        if (isCorrectOverride !== undefined) {
            isCorrect = isCorrectOverride;
        } else if (currentQ.options && currentQ.options.length > 0) {
            isCorrect = selectedAnswer === currentQ.correct_answer;
        }

        // Visualize feedback first before auto-submitting if we wanted
        // But here we want a clear "I got it right/wrong" confirmation for revisions usually.
        // Let's adopt the flow: Select -> Check -> Show Result -> Rate (Got it right/wrong) if needed or just Next.

        if (!showAnswer) {
            setShowAnswer(true);
            return;
        }

        // If we are showing answer, user clicks expected "Got it right" / "Got it wrong" buttons
        if (isCorrectOverride === undefined) {
            // Fallback if they just clicked "Next" without explicit rating?
            // Ideally we force them to rate.
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/revision/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    revisionId: revisions[currentIndex].id,
                    isCorrect: isCorrect
                })
            });

            if (response.ok) {
                const result = await response.json();
                toast({
                    title: isCorrect ? "Great Job!" : "Review Scheduled",
                    description: result.message || `Next review: ${result.nextDate}`,
                    variant: isCorrect ? "default" : "destructive"
                });

                setCompletedCount(prev => prev + 1);
                if (currentIndex < revisions.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                    setShowAnswer(false);
                    setSelectedAnswer('');
                } else {
                    setRevisions([]);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentItem = revisions[currentIndex];
    const q = currentItem?.question;

    useEffect(() => {
        if (q?.qid) {
            (window as any).__currentQuestionId = q.qid;
            (window as any).__onUpdateExplanation = (explanation: string, correctOption?: string) => {
                q.explanation = explanation;
                if (correctOption) {
                    const optionMapping: { [key: string]: string } = {'A': '1', 'B': '2', 'C': '3', 'D': '4'};
                    const mappedVal = optionMapping[correctOption] || correctOption;
                    q.correct_answer = mappedVal;
                }
                setRenderTrigger(prev => prev + 1);
            };
        }
        return () => {
            delete (window as any).__currentQuestionId;
            delete (window as any).__onUpdateExplanation;
        };
    }, [q?.qid, renderTrigger]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (revisions.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="max-w-md mx-auto">
                        <CheckCircle2 className="h-16 w-16 mx-auto mb-6 text-green-500" />
                        <h1 className="text-2xl font-bold mb-2">You're all caught up!</h1>
                        <p className="text-muted-foreground mb-6">
                            {completedCount > 0
                                ? `You reviewed ${completedCount} questions today.`
                                : "No questions scheduled for revision right now."}
                        </p>
                        <Button onClick={() => setLocation('/upsc')}>
                            Back to UPSC Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // (moved up)

    if (!selectedSubject) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader />
                <main className="container mx-auto px-4 py-8 flex-1">
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Link href="/upsc" className="hover:text-primary transition-colors">UPSC</Link>
                                <span>/</span>
                                <span className="text-foreground font-medium">Spaced Revision</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Spaced Revision</h1>
                            <p className="text-xl text-muted-foreground">
                                Review your mistakes from tests using our spaced repetition algorithm.
                            </p>
                        </div>

                        {Object.keys(groupedRevisions).length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(groupedRevisions).map(([subject, items]) => (
                                    <Card
                                        key={subject}
                                        className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                    >
                                        <CardHeader>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                    <Brain className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <CardTitle className="text-xl">{subject}</CardTitle>
                                            <CardDescription>
                                                {items.length} questions pending review
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button
                                                className="w-full"
                                                onClick={() => startRevisionForSubject(subject, items)}
                                            >
                                                Start Review
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-12 text-center border-dashed">
                                <div className="flex justify-center mb-4">
                                    <div className="p-4 bg-muted rounded-full">
                                        <Brain className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                    No Pending Revisions
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    You don't have any pending revisions for your mock tests. Great job!
                                </p>
                                <Link href="/upsc">
                                    <Button>Go to Tests</Button>
                                </Link>
                            </Card>
                        )}
                    </div>
                </main>
                <AppFooter />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppHeader />
            <main className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center">
                <div className="w-full max-w-3xl">
                    <Button variant="ghost" onClick={() => setSelectedSubject(null)} className="mb-4 pl-0 hover:bg-transparent hover:underline text-muted-foreground">
                        ← Back to Subjects
                    </Button>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{selectedSubject} Revision</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {currentIndex + 1} of {revisions.length}
                        </span>
                    </div>

                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="text-lg font-medium mb-6">
                                <Latex>{q.question_text}</Latex>
                            </div>

                            <div className="space-y-3">
                                {q.options && q.options.length > 0 ? (
                                    q.options.map(opt => (
                                        <div
                                            key={opt.data_option}
                                            className={`
                                        p-3 border rounded-lg cursor-pointer transition-colors
                                        ${showAnswer
                                                    ? opt.data_option === q.correct_answer
                                                        ? 'bg-green-100 border-green-500 dark:bg-green-900/30'
                                                        : selectedAnswer === opt.data_option
                                                            ? 'bg-red-100 border-red-500 dark:bg-red-900/30'
                                                            : 'opacity-50'
                                                    : selectedAnswer === opt.data_option
                                                        ? 'bg-primary/10 border-primary'
                                                        : 'hover:bg-accent'
                                                }
                                    `}
                                            onClick={() => !showAnswer && setSelectedAnswer(opt.data_option)}
                                        >
                                            <div className="flex gap-2">
                                                <span className="font-bold">{opt.label || opt.data_option})</span>
                                                <Latex>{opt.option_text}</Latex>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No options available.</p>
                                )}
                            </div>
                        </CardContent>

                        {showAnswer && (
                            <CardFooter className="flex-col items-start border-t bg-muted/20 p-6">
                                <div className="mb-4">
                                    <span className="font-bold text-green-600 mr-2">Correct Answer:</span>
                                    {q.correct_answer}
                                </div>
                                {q.explanation && (
                                    <div className="text-sm text-muted-foreground mb-6">
                                        <span className="font-bold block mb-1">Explanation:</span>
                                        <Latex>{q.explanation}</Latex>
                                    </div>
                                )}

                                <div className="w-full">
                                    <p className="text-center text-sm font-medium mb-3">How did you do?</p>
                                    <div className="flex gap-4 justify-center">
                                        <Button
                                            variant="destructive"
                                            className="w-32"
                                            onClick={() => handleSubmitAnswer(false)}
                                            disabled={isSubmitting}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" /> Got it wrong
                                        </Button>
                                        <Button
                                            className="w-32 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleSubmitAnswer(true)}
                                            disabled={isSubmitting}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Got it right
                                        </Button>
                                    </div>
                                </div>
                            </CardFooter>
                        )}
                    </Card>

                    {!showAnswer && (
                        <Button
                            className="w-full size-lg"
                            onClick={() => handleSubmitAnswer()}
                            disabled={!selectedAnswer}
                        >
                            Check Answer
                        </Button>
                    )}
                </div>
            </main>
            <AppFooter />
        </div>
    );
};

export default UPSCRevisionPage;
