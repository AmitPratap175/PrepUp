import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { UPSCQuizInterface } from "@/components/UPSCQuizInterface";
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import type { PracticeTest, UserAnswer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function UPSCReviewMistakesPage() {
    const [match, params] = useRoute("/upsc/review/:sessionId");
    const sessionId = params?.sessionId;
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const [test, setTest] = useState<PracticeTest | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [initialAnswers, setInitialAnswers] = useState<UserAnswer[]>([]);

    useEffect(() => {
        if (sessionId) {
            fetchSessionAndTest();
        }
    }, [sessionId]);

    const fetchSessionAndTest = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Token ${token}` };

            // 1. Fetch Session
            const sessionRes = await fetch(`/api/test-sessions/${sessionId}/`, { headers });
            if (!sessionRes.ok) throw new Error("Failed to fetch session");
            const sessionData = await sessionRes.json();

            // 2. Fetch Test
            const testRes = await fetch(`/api/practice-tests/${sessionData.testId}/`, { headers });
            if (!testRes.ok) throw new Error("Failed to fetch test");
            const testData: PracticeTest = await testRes.json();

            // 3. Filter Incorrect Questions
            const questions = (testData.questions || []) as any[];
            const incorrectQuestions: any[] = [];
            const incorrectAnswers: UserAnswer[] = [];

            // sessionData.answers may be incomplete if user skipped questions, handle gracefully
            const answersMap: Record<string, string> = {};
            (sessionData.answers || []).forEach((a: any) => {
                if (a.selectedAnswer) answersMap[a.questionId] = a.selectedAnswer;
            });

            questions.forEach(q => {
                const userAns = answersMap[q.id || q.qid];
                // If user answered incorrectly OR skipped (if we want to review skipped too? User said "mistakes", usually implies wrong answers. Let's include skipped for completeness if wanted, usually skipped != mistake. Let's stick to WRONG answers for "Mistakes")
                // Actually, let's include WRONG only.
                // Skipped questions result in userAns being undefined.
                // Correct answer check:
                if (userAns && userAns !== q.correct_answer) {
                    incorrectQuestions.push(q);
                    incorrectAnswers.push({
                        questionId: q.id || q.qid,
                        selectedAnswer: userAns,
                        timeSpent: 0,
                        isMarkedForReview: false
                    });
                }
            });

            if (incorrectQuestions.length === 0) {
                toast({
                    title: "Great Job!",
                    description: "You have no incorrect answers to review in this session.",
                });
                setLocation('/upsc'); // Or back to result
                return;
            }

            // Create a "Revision Test" object
            const revisionTest: PracticeTest = {
                ...testData,
                title: `Review: ${testData.title}`,
                questions: incorrectQuestions,
                totalQuestions: incorrectQuestions.length,
                duration: incorrectQuestions.length * 2, // Arbitrary duration
            };

            setTest(revisionTest);
            setInitialAnswers(incorrectAnswers);

        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load review session.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExit = () => {
        // Go back to the result page for this session
        setLocation(`/upsc/result/${sessionId}`);
    };

    // Review mode doesn't really need "Submission", but the interface expects it.
    // We can just treat it as a practice run or ignore submission.
    const handleSubmit = () => {
        toast({
            title: "Review Complete",
            description: "You have reviewed your mistakes.",
        });
        handleExit();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!test) return null;

    return (
        <UPSCQuizInterface
            test={test}
            onExit={handleExit}
            onSubmit={handleSubmit}
            onProgressUpdate={() => { }}
            navigateToQuestion={setCurrentQuestionIndex}
            currentQuestionIndex={currentQuestionIndex}
            duration={undefined} // No timer for review?
            initialAnswers={initialAnswers}
        />
    );
}
