import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import TestResultInterface from "@/components/test-result-interface";
import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { useRoute } from "wouter";

interface DailyTargetResultData {
    targetId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
    timeTaken: number; // or calculate from startTime/endTime
    questions: any[];
    answers: Record<string, string>; // User's answers mapped by questionId
    subject: string;
}

export default function DailyTargetResultPage() {
    const [match, params] = useRoute("/daily-targets/result/:targetId");
    const targetId = params?.targetId;

    const [resultData, setResultData] = useState<DailyTargetResultData | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();
    const [location, navigate] = useLocation();

    useEffect(() => {
        if (targetId) {
            fetchResult();
        }
    }, [targetId]);

    const fetchResult = async () => {
        try {
            // targetId here is actually the sessionId passed in the URL
            const response = await fetch(`/api/daily-targets/session-result/${targetId}/`, {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();

                // Map answers from array to object for TestResultInterface
                const answersMap: { [key: string]: string } = {};
                data.answers.forEach((a: any) => {
                    if (a.selectedAnswer) answersMap[a.questionId] = a.selectedAnswer;
                });

                // Calculate stats 
                let correctCount = 0;
                let incorrectCount = 0;
                data.answers.forEach((a: any) => {
                    if (a.selectedAnswer) {
                        if (a.isCorrect) correctCount++;
                        else incorrectCount++;
                    }
                });

                const accuracy = (data.totalQuestions > 0) ? (correctCount / data.totalQuestions) * 100 : 0;

                setResultData({
                    targetId: data.testId,
                    score: data.score || 0,
                    totalQuestions: data.totalQuestions,
                    correctAnswers: correctCount,
                    incorrectAnswers: incorrectCount,
                    accuracy: accuracy,
                    timeTaken: 0,
                    questions: data.questions,
                    answers: answersMap,
                    subject: data.subject
                });
            } else {
                // Fallback or error
                console.error("Failed to fetch session results");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) return <Redirect to="/login" />;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!resultData) {
        return <div>Result not found.</div>;
    }

    // Map to TestResultInterface props
    const testProp = {
        id: resultData.targetId,
        title: `${resultData.subject} Daily Target Result`,
        subject: resultData.subject,
        questions: resultData.questions.map((q: any) => ({
            ...q,
            options: q.options.map((opt: any) => ({
                ...opt,
                is_correct: opt.data_option === q.correct_answer
            })),
            correct_option_data: q.correct_answer,
            solution_text: q.explanation
        }))
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-grow">
                <TestResultInterface
                    test={testProp as any}
                    userAnswers={resultData.answers}
                    score={resultData.score}
                    accuracy={resultData.accuracy}
                    timeTaken={"N/A"} // TODO: Track time
                    attemptedQuestions={resultData.correctAnswers + resultData.incorrectAnswers}
                    totalQuestions={resultData.totalQuestions}
                    correctAnswers={resultData.correctAnswers}
                    incorrectAnswers={resultData.incorrectAnswers}
                    onReturnToDashboard={() => navigate("/daily-targets")}
                />
            </main>
        </div>
    );
}
