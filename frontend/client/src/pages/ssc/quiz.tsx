import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Loader2, AlertCircle } from 'lucide-react';
import MockTestInterface from '@/components/mock-test-interface';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PracticeTest, UserAnswer } from '@shared/schema';
import { useAuth } from '@/contexts/auth-context';

const SSCQuizPage: React.FC = () => {
    const [, params] = useRoute('/ssc/test/:id');
    const [, setLocation] = useLocation();
    const { user } = useAuth();
    const testId = params?.id;

    const { data: test, isLoading, error } = useQuery<PracticeTest>({
        queryKey: [`/api/practice-tests/${testId}`],
        queryFn: async () => {
             const response = await fetch(`/api/practice-tests/${testId}/`);
             if (!response.ok) throw new Error('Failed to fetch test data');
             return response.json();
        },
        enabled: !!testId
    });

    const handleQuizSubmit = async (answers: UserAnswer[]) => {
        if (!user || !testId) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/test-sessions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    testId: testId,
                    userId: user.id,
                    answers: answers,
                    totalQuestions: test?.totalQuestions || 0,
                    correctAnswers: 0, // Backend should calculate this
                    score: 0, // Backend should calculate this
                    isCompleted: true,
                    startTime: new Date().toISOString(),
                    endTime: new Date().toISOString(),
                })
            });

            if (response.ok) {
                const session = await response.json();
                setLocation(`/ssc/result/${session.id}`);
            }
        } catch (err) {
            console.error('Failed to submit quiz:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load the test. Please try again later.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <MockTestInterface
            test={test}
            onSubmit={handleQuizSubmit}
        />
    );
};

export default SSCQuizPage;
