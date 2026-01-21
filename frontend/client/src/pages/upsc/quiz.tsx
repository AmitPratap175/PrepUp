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

        // In a real app, we would calculate on backend or frontend
        // For UPSC, we'll just show a success toast and go back to results or landings
        // Since we don't have a dedicated result page for UPSC yet, let's keep it simple.

        toast({
            title: "Success",
            description: "You have completed the UPSC quiz!",
        });
        setLocation('/upsc');
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
