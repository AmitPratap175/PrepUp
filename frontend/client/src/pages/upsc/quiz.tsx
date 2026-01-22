import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { UPSCQuizInterface } from "@/components/UPSCQuizInterface";
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { PracticeTest, UserAnswer } from "@shared/schema";

const UPSCQuizPage: React.FC = () => {
    const [match, params] = useRoute("/upsc/test/:id");
    const testId = params?.id;
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [test, setTest] = useState<PracticeTest | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const [startTime] = useState<string>(new Date().toISOString());

    useEffect(() => {
        if (testId) {
            fetchTest();
        }
    }, [testId]);

    const fetchTest = async () => {
        try {
            const response = await fetch(`/api/practice-tests/${testId}/`, {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const data = await response.json();
                setTest(data);
            } else {
                throw new Error('Failed to fetch test');
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
        setLocation('/upsc');
    };

    const handleSubmit = async (userAnswers: UserAnswer[]) => {
        if (!test) return;

        // Calculate score
        let totalScore = 0;
        const questions = (test.questions || []) as any[];

        // Prepare answers with correctness
        const processedAnswers = userAnswers.map(ans => {
            const question = questions.find((q: any) => (q.qid || q.id) === ans.questionId);
            if (!question) return ans;

            const isCorrect = ans.selectedAnswer === question.correct_answer;
            if (isCorrect) totalScore++; // Simple +1 scoring for now matching result page logic

            return {
                questionId: ans.questionId,
                selectedAnswer: ans.selectedAnswer,
                isCorrect
            };
        });

        const payload = {
            testId: test.id,
            startTime: startTime,
            totalQuestions: questions.length,
            answers: processedAnswers,
            score: totalScore,
            subject: test.subject,
            maxScore: questions.length
        };

        // Schedule revisions for incorrect answers
        const incorrectAnswers = processedAnswers.filter((a: any) => !a.isCorrect);
        if (incorrectAnswers.length > 0) {
            try {
                const revisionItems = incorrectAnswers.map(ans => {
                    const question = questions.find((q: any) => (q.qid || q.id) === ans.questionId);
                    return {
                        questionId: ans.questionId,
                        subject: test.subject || "Current Affairs",
                        questionData: question
                    };
                });

                await fetch('/api/revision/schedule/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ items: revisionItems })
                });
            } catch (err) {
                console.error("Failed to schedule revisions:", err);
            }
        }

        try {
            const response = await fetch('/api/test-sessions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: "Success",
                    description: "Quiz submitted successfully!",
                });
                setLocation(`/upsc/result/${data.id}`);
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to submit quiz.",
                variant: "destructive",
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

    if (!test) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <p className="text-muted-foreground mb-4">Test not found.</p>
                <Button onClick={handleExit}>Go Back</Button>
            </div>
        );
    }

    return (
        <UPSCQuizInterface
            test={test}
            onExit={handleExit}
            onSubmit={handleSubmit}
            onProgressUpdate={() => { }} // UPSC progress update can be added later
            navigateToQuestion={setCurrentQuestionIndex}
            currentQuestionIndex={currentQuestionIndex}
            duration={test.duration * 60}
        />
    );
};

export default UPSCQuizPage;
