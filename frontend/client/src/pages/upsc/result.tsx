import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import TestResultInterface from "@/components/test-result-interface";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PracticeTest, UserAnswer } from "@shared/schema";

interface SessionData {
    id: string;
    testId: string;
    score: number;
    totalQuestions: number;
    answers: UserAnswer[];
    subject: string;
}

export default function UPSCResultPage() {
    const [match, params] = useRoute("/upsc/result/:sessionId");
    const sessionId = params?.sessionId;
    const [, setLocation] = useLocation();

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<SessionData | null>(null);
    const [test, setTest] = useState<PracticeTest | null>(null);

    useEffect(() => {
        if (sessionId) {
            fetchData();
        }
    }, [sessionId]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Token ${token}` };

            // 1. Fetch Session
            const sessionRes = await fetch(`/api/test-sessions/${sessionId}/`, { headers });
            if (!sessionRes.ok) throw new Error("Failed to fetch session");
            const sessionData: SessionData = await sessionRes.json();
            setSession(sessionData);

            // 2. Fetch Test Details (for questions and solutions)
            let testRes = await fetch(`/api/practice-tests/${sessionData.testId}/`, { headers });
            if (!testRes.ok) {
                testRes = await fetch(`/api/upsc/2027-tests/${sessionData.testId}/`, { headers });
            }
            if (!testRes.ok) throw new Error("Failed to fetch test");
            const testData: PracticeTest = await testRes.json();
            setTest(testData);

        } catch (error) {
            console.error("Error fetching result data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!session || !test) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Result not found.</p>
                <button onClick={() => setLocation('/upsc')} className="mt-4 text-primary hover:underline">
                    Return to UPSC Home
                </button>
            </div>
        );
    }

    // Convert answers array to map for the interface
    const userAnswersMap: Record<string, string> = {};
    session.answers.forEach(a => {
        if (a.selectedAnswer) {
            userAnswersMap[a.questionId] = a.selectedAnswer;
        }
    });

    // Calculate accuracy and counts
    let correctCount = 0;
    let incorrectCount = 0;

    // We iterate over questions to check against user answers
    // Note: session.score might be pre-calculated but we can double check or just use it.
    // For counts, we compare user answer with correct answer.
    const questions = (test.questions || []) as any[];
    questions.forEach((q: any) => {
        const userAns = userAnswersMap[q.id || q.qid];
        if (userAns) {
            const correctOption = q.options?.find((o: any) => o.is_correct || o.label === q.correct_option_data);
            const isCorrect = correctOption ? userAns === correctOption.label : userAns === q.correct_answer;
            
            if (isCorrect) {
                correctCount++;
            } else {
                incorrectCount++;
            }
        }
    });

    const accuracy = session.totalQuestions > 0 ? (correctCount / session.totalQuestions) * 100 : 0;
    const attemptedCount = correctCount + incorrectCount;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-grow">
                <TestResultInterface
                    test={test}
                    userAnswers={userAnswersMap}
                    score={Math.round(accuracy)} // Using accuracy as score percentage for now, or use session.score if it's points
                    accuracy={accuracy}
                    timeTaken={"N/A"} // Session doesn't strictly track duration in a way we can easily display yet without start/end diff
                    attemptedQuestions={attemptedCount}
                    totalQuestions={session.totalQuestions}
                    correctAnswers={correctCount}
                    incorrectAnswers={incorrectCount}
                    onReturnToDashboard={() => setLocation("/upsc")}
                    customActions={
                        <div className="flex gap-2">
                            <Button onClick={() => setLocation(`/upsc/test/${session.testId}`)} variant="outline">
                                Retake Test
                            </Button>
                            {incorrectCount > 0 && (
                                <Button onClick={() => setLocation(`/upsc/review/${session.id}`)} variant="secondary">
                                    Review Mistakes
                                </Button>
                            )}
                        </div>
                    }
                />
            </main>
        </div>
    );
}
