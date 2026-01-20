import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { DailyTargetInterface } from "@/components/DailyTargetInterface";
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PracticeTest, UserAnswer } from "@shared/schema";

interface Question {
    id: string;
    qid: string;
    question_text: string;
    options: { label: string; option_text: string; data_option: string; is_correct?: boolean }[];
    correct_answer: string;
    passage_text?: string;
    image_url?: string;
    type: string;
    correct_option_data?: string; // For compatibility
    solution_text?: string;
}

interface DailyTarget {
    id: string;
    subject: string;
    questions: Question[];
    timePerQuestion: number;
    isCompleted: boolean;
}

const DailyTargetTestInterface: React.FC = () => {
    const [match, params] = useRoute("/daily-targets/test/:subject");
    const subject = params?.subject ? decodeURIComponent(params.subject) : null;

    const [target, setTarget] = useState<DailyTarget | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Provide a mocked PracticeTest object to NewQuizInterface
    const [quizData, setQuizData] = useState<PracticeTest | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [initialAnswers, setInitialAnswers] = useState<UserAnswer[]>([]);


    useEffect(() => {
        if (subject) {
            fetchTarget();
        }
    }, [subject]);

    const fetchTarget = async () => {
        try {
            // First find the target to get ID
            const listResponse = await fetch('/api/daily-targets/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });

            if (!listResponse.ok) throw new Error('Failed to fetch targets');

            const listData: any[] = await listResponse.json();
            const foundTargetInfo = listData.find(t =>
                t.subject.toLowerCase() === subject?.toLowerCase() ||
                (subject?.toLowerCase() === 'quants' && t.subject === 'Quantitative Aptitude')
            );

            if (!foundTargetInfo) {
                throw new Error('Target not found');
            }

            // Now call start API to get/create session
            const startResponse = await fetch('/api/daily-targets/start/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ targetId: foundTargetInfo.id })
            });

            if (startResponse.ok) {
                const data = await startResponse.json();
                const targetData = data.target;
                const progress = data.progress;

                setSessionId(data.sessionId);
                setTarget(targetData);
                setCurrentQuestionIndex(progress.currentQuestionIndex || 0);

                // Map session answers to UserAnswer format if they aren't already
                const mappedAnswers = (progress.answers || []).map((a: any) => ({
                    questionId: a.questionId,
                    selectedAnswer: a.selectedAnswer
                }));
                setInitialAnswers(mappedAnswers);

                // Transform to PracticeTest format
                const transformedQuestions = targetData.questions.map((q: any) => ({
                    ...q,
                    options: q.options.map((opt: any) => ({
                        ...opt,
                        is_correct: opt.data_option === q.correct_answer
                    })),
                    correct_option_data: q.correct_answer,
                    solution_text: q.explanation
                }));

                setQuizData({
                    id: targetData.id,
                    title: `${targetData.subject} Daily Target`,
                    subject: targetData.subject,
                    totalQuestions: targetData.questions.length,
                    examType: "CAT",
                    questions: transformedQuestions,
                } as PracticeTest);

            } else {
                throw new Error('Failed to start test session');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load test.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExit = () => {
        window.location.href = '/daily-targets';
    };

    const handleSubmit = async (userAnswers: UserAnswer[]) => {
        if (!target) return;

        // Calculate score and format payload
        let totalScore = 0;
        const answerPayload = userAnswers.map(ans => {
            const question = target.questions.find(q => (q.qid || q.id) === ans.questionId);
            if (!question) return null;

            const isCorrect = ans.selectedAnswer === question.correct_answer;
            let questionScore = 0;
            if (isCorrect) {
                questionScore = 3;
            } else if (ans.selectedAnswer && question.options.length > 0) {
                questionScore = -1;
            }

            if (isCorrect) totalScore += questionScore; // Only add positive here?
            // Actually, logic: score += questionScore

            return {
                questionId: ans.questionId,
                selectedAnswer: ans.selectedAnswer,
                isCorrect: isCorrect,
                score: questionScore
            };
        }).filter(Boolean);

        // Re-sum score properly
        const calculatedScore = answerPayload.reduce((acc: number, curr: any) => acc + curr.score, 0);

        try {
            const response = await fetch('/api/daily-targets/submit/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    targetId: target.id,
                    answers: answerPayload,
                    score: calculatedScore
                })
            });

            if (response.ok) {
                toast({
                    title: "Submitted",
                    description: `Test submitted successfully. Score: ${calculatedScore}`,
                });
                window.location.href = '/daily-targets?tab=revision';
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to submit test.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!quizData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <p className="text-muted-foreground mb-4">Target not found.</p>
                <Button onClick={handleExit}>Go Back</Button>
            </div>
        );
    }

    // Calculate total duration (default 120s if not set)
    const duration = target ? target.questions.length * (target.timePerQuestion || 120) : 0;

    const handleProgressUpdate = async (userAnswers: UserAnswer[], currentIndex: number) => {
        if (!sessionId) return;

        try {
            await fetch(`/api/test-sessions/${sessionId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    answers: userAnswers,
                    currentQuestionIndex: currentIndex
                })
            });
        } catch (error) {
            console.error('Failed to sync progress:', error);
        }
    };

    return (
        <DailyTargetInterface
            test={quizData}
            onExit={handleExit}
            onSubmit={handleSubmit}
            onProgressUpdate={handleProgressUpdate}
            navigateToQuestion={setCurrentQuestionIndex}
            currentQuestionIndex={currentQuestionIndex}
            duration={duration}
            initialAnswers={initialAnswers}
        />
    );
};

export default DailyTargetTestInterface;
