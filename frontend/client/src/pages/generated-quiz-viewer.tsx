import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { UPSCQuizInterface } from "@/components/UPSCQuizInterface";
import { LocalResultView } from "@/components/local-result-view";
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import type { PracticeTest, UserAnswer } from "@shared/schema";

interface NotebookLMQuizOption {
    text: string;
    isCorrect: boolean;
    rationale: string;
}

interface NotebookLMQuestion {
    id: number;
    question: string;
    answerOptions: NotebookLMQuizOption[];
    hint: string;
}

interface NotebookLMQuizData {
    title: string;
    questions: NotebookLMQuestion[];
}

interface GeneratedQuizResponse {
    source: string;
    generated_at: string;
    quiz_data: NotebookLMQuizData;
}

const GeneratedQuizViewerPage: React.FC = () => {
    const [match, params] = useRoute("/generated-quiz/:id");
    const quizId = params?.id;
    const [, setLocation] = useLocation();

    const [practiceTest, setPracticeTest] = useState<PracticeTest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);
    const [finalAnswers, setFinalAnswers] = useState<UserAnswer[]>([]);

    useEffect(() => {
        if (quizId) {
            fetchQuiz(quizId);
        }
    }, [quizId]);

    const fetchQuiz = async (id: string) => {
        try {
            const response = await fetch(`/api/generate-quiz/?id=${id}`, {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const data: GeneratedQuizResponse = await response.json();
                const convertedTest = convertToPracticeTest(data, id);
                setPracticeTest(convertedTest);
            } else {
                throw new Error('Failed to fetch quiz data');
            }
        } catch (err) {
            console.error(err);
            setError("Could not load the quiz. It may not exist or has been deleted.");
        } finally {
            setLoading(false);
        }
    };

    const convertToPracticeTest = (data: GeneratedQuizResponse, id: string): PracticeTest => {
        const questions: any[] = data.quiz_data.questions.map((q, index) => {
            const correctOptionIndex = q.answerOptions.findIndex(o => o.isCorrect);
            const options = q.answerOptions.map((opt, i) => ({
                label: String.fromCharCode(97 + i), // a, b, c, d
                option_text: opt.text,
                data_option: String.fromCharCode(97 + i),
                explanation: opt.rationale
            }));

            return {
                id: "gen_" + q.id,
                qid: "gen_" + q.id,
                question_text: q.question,
                options: options,
                correct_answer: String.fromCharCode(97 + correctOptionIndex),
                explanation: q.answerOptions[correctOptionIndex]?.rationale || "",
                passage_text: null,
                status: 'active',
                created_at: new Date().toISOString()
            };
        });

        return {
            id: id,
            title: data.quiz_data.title || `Quiz from ${data.source}`,
            description: "AI Generated Quiz",
            examType: "upsc",
            subject: "Generated",
            duration: 60,
            totalQuestions: questions.length,
            questions: questions,
            is_full_length: false,
            created_at: data.generated_at
        } as PracticeTest;
    };

    const handleExit = () => {
        if (quizFinished) {
            setQuizFinished(false);
        } else {
            setLocation('/quiz-generator');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error || !practiceTest) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <AppHeader />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <Alert variant="destructive" className="max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error || "Quiz not found"}</AlertDescription>
                    </Alert>
                    <Button onClick={handleExit} className="mt-4">
                        Back to Generator
                    </Button>
                </div>
                <AppFooter />
            </div>
        );
    }

    if (quizFinished) {
        return (
            <LocalResultView
                test={practiceTest}
                userAnswers={finalAnswers}
                onExit={handleExit}
                onRetake={() => {
                    setQuizFinished(false);
                    setCurrentQuestionIndex(0);
                    setFinalAnswers([]);
                }}
            />
        );
    }

    return (
        <UPSCQuizInterface
            test={practiceTest}
            onExit={handleExit}
            onSubmit={(answers) => {
                setFinalAnswers(answers);
                setQuizFinished(true);
            }}
            onProgressUpdate={() => { }}
            navigateToQuestion={setCurrentQuestionIndex}
            currentQuestionIndex={currentQuestionIndex}
            duration={60 * 60}
        />
    );
};

export default GeneratedQuizViewerPage;
