import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { AppHeader } from '@/components/app-header';
import TestResultInterface from '@/components/test-result-interface';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { TestSession, PracticeTest } from '@shared/schema';

const SSCResultPage: React.FC = () => {
    const [, params] = useRoute('/ssc/result/:id');
    const sessionId = params?.id;
    const [, setLocation] = useLocation();

    const { data: session, isLoading: isSessionLoading, error: sessionError } = useQuery<TestSession>({
        queryKey: [`/api/test-sessions/${sessionId}/`],
        queryFn: async () => {
            const response = await fetch(`/api/test-sessions/${sessionId}/`, {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch session');
            return response.json();
        },
        enabled: !!sessionId
    });

    const testId = session?.testId;

    const { data: test, isLoading: isTestLoading, error: testError } = useQuery<PracticeTest>({
        queryKey: [`/api/practice-tests/${testId}`],
        queryFn: async () => {
            const response = await fetch(`/api/practice-tests/${testId}/`);
            if (!response.ok) throw new Error('Failed to fetch test data');
            return response.json();
        },
        enabled: !!testId
    });

    if (isSessionLoading || isTestLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (sessionError || testError || !session || !test) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader />
                <main className="container mx-auto px-4 py-8">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            We couldn't retrieve your test results. Please try again later.
                        </AlertDescription>
                    </Alert>
                    <div className="mt-6 text-center">
                        <Button onClick={() => setLocation('/ssc')}>Return to SSC Home</Button>
                    </div>
                </main>
            </div>
        );
    }

    // Convert answers to Record<string, string>
    const userAnswers: Record<string, string> = {};
    if (session.answers && Array.isArray(session.answers)) {
        session.answers.forEach((ans: any) => {
            if (ans.questionId && ans.selectedAnswer) {
                userAnswers[ans.questionId] = ans.selectedAnswer;
            }
        });
    }

    const accuracy = session.totalQuestions > 0 ? (Number(session.correctAnswers || 0) / session.totalQuestions) * 100 : 0;
    const attemptedQuestions = Object.keys(userAnswers).length;
    const incorrectAnswers = attemptedQuestions - Number(session.correctAnswers || 0);

    const formatTimeSpent = (session: TestSession) => {
        if (!session.startTime || !session.endTime) return "N/A";
        const start = new Date(session.startTime).getTime();
        const end = new Date(session.endTime).getTime();
        const seconds = Math.floor((end - start) / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppHeader />
            <main className="flex-grow">
                <TestResultInterface
                    test={test}
                    userAnswers={userAnswers}
                    score={Number(session.score || 0)}
                    accuracy={accuracy}
                    timeTaken={formatTimeSpent(session)}
                    attemptedQuestions={attemptedQuestions}
                    totalQuestions={session.totalQuestions}
                    correctAnswers={Number(session.correctAnswers || 0)}
                    incorrectAnswers={incorrectAnswers}
                    onReturnToDashboard={() => setLocation('/ssc')}
                    customActions={
                        <Button
                            variant="outline"
                            onClick={() => setLocation(`/ssc/test/${testId}`)}
                        >
                            Retake Test
                        </Button>
                    }
                />
            </main>
        </div>
    );
};

export default SSCResultPage;
