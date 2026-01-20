import React, { useState, useEffect } from 'react';
import Latex from 'react-latex-next';
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { Loader2, Repeat, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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

const DailyTargetRevision: React.FC = () => {
    const [revisions, setRevisions] = useState<RevisionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        fetchRevisions();
    }, []);

    const fetchRevisions = async () => {
        try {
            const response = await fetch('/api/revision/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRevisions(data);
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

    const handleSubmitAnswer = async (isCorrectOverride?: boolean) => {
        if (!revisions[currentIndex]) return;

        // Determine correctness
        // If override is provided (e.g. for self-grading), use it.
        // Otherwise check against correct_answer for MCQ
        let isCorrect = false;
        const currentQ = revisions[currentIndex].question;

        if (isCorrectOverride !== undefined) {
            isCorrect = isCorrectOverride;
        } else if (currentQ.options && currentQ.options.length > 0) {
            isCorrect = selectedAnswer === currentQ.correct_answer;
        } else {
            // TITA or tricky case, maybe force self-grade?
            // For now assume exact match for TITA or require self-grade if not MCQ
            // Let's rely on showAnswer -> "I got it right" / "I got it wrong" flow after showing answer?
            // Logic:
            // 1. User selects/types answer.
            // 2. Click "Check".
            // 3. System shows result + Correct Answer.
            // 4. Click "Next" -> Submit.
            // Let's simplify:
            // If MCQ, auto-grade.
            // If TITA, show answer and ask "Did you get it right?".
        }

        // Actually, for Revision, "Show Answer" is common. 
        // Let's support: Submit -> Show Feedback -> Next.

        // If not showing answer yet, just show it.
        if (!showAnswer) {
            setShowAnswer(true);
            return;
        }

        // If showing answer, then "Next" submits status.
        // But we need to know if it was correct.

        if (currentQ.options && currentQ.options.length > 0) {
            isCorrect = selectedAnswer === currentQ.correct_answer;
        } else {
            // For TITA, rely on user self-evaluation? 
            // Or just matching.
            isCorrect = selectedAnswer.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase();
            // If mismatched, maybe ask user?
            // Let's stick to auto-match for MVP.
        }

        // For manual override (Self-grade buttons)
        if (isCorrectOverride !== undefined) isCorrect = isCorrectOverride;

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
                    title: isCorrect ? "Keep it up!" : "Scheduled for review",
                    description: result.message || `Next review: ${result.nextDate}`,
                    variant: isCorrect ? "default" : "destructive" // Visual cue
                });

                // Move to next
                setCompletedCount(prev => prev + 1);
                if (currentIndex < revisions.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                    setShowAnswer(false);
                    setSelectedAnswer('');
                } else {
                    // All done
                    setRevisions([]); // Clear list to show done state
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        <Button onClick={() => window.location.href = '/daily-targets'}>
                            Back to Daily Targets
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const currentItem = revisions[currentIndex];
    const q = currentItem.question;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppHeader />
            <main className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center">
                <div className="w-full max-w-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Repeat className="h-5 w-5 text-primary" />
                            <span className="font-semibold">Revision Session</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {currentIndex + 1} of {revisions.length}
                        </span>
                    </div>

                    <Card className="mb-6">
                        <CardContent className="p-6">
                            {q.passage_text && (
                                <div className="mb-6 p-4 bg-muted/50 rounded-lg text-sm max-h-60 overflow-y-auto">
                                    <Latex>{q.passage_text}</Latex>
                                </div>
                            )}

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
                                                <span className="font-bold">{opt.label})</span>
                                                <Latex>{opt.option_text}</Latex>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-lg"
                                        placeholder="Type answer..."
                                        value={selectedAnswer}
                                        onChange={(e) => setSelectedAnswer(e.target.value)}
                                        disabled={showAnswer}
                                    />
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
                                            variant="default" // Using default (usually primary color) for success action? Or green?
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
        </div>
    );
};

export default DailyTargetRevision;
