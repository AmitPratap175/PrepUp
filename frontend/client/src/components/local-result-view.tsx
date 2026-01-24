import React from 'react';
import { useLocation } from 'wouter';
import TestResultInterface from "@/components/test-result-interface";
import type { PracticeTest, UserAnswer } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface GenericResultState {
    test: PracticeTest;
    userAnswers: UserAnswer[];
    score: number; // Raw score count
    totalQuestions: number;
}

const GenericResultPage: React.FC = () => {
    const [, setLocation] = useLocation();
    // In wouter, we can't easily access history state in the standard hook way if not passed via context.
    // However, since we are building a Single Page App, we can expect the data to be passed via a global store or just keep it simple:
    // Actually, wouter doesn't support state in `navigate`.
    // We will assume the parent component renders this view conditionally OR we rely on a lightweight store.
    // For now, let's assume the parent (Chapterwise/Generated Page) renders this component directly instead of navigating to a new route.
    return null;
};

interface LocalResultProps {
    test: PracticeTest;
    userAnswers: UserAnswer[]; // Array of answers
    onExit: () => void;
    onRetake: () => void;
}

export const LocalResultView: React.FC<LocalResultProps> = ({ test, userAnswers, onExit, onRetake }) => {

    // Map array to object for interface
    const userAnswersMap: Record<string, string> = {};
    userAnswers.forEach(a => {
        if (a.selectedAnswer) {
            userAnswersMap[a.questionId] = a.selectedAnswer;
        }
    });

    let correctCount = 0;

    // Calculate score
    const questions = (test.questions || []) as any[];
    questions.forEach((q: any) => {
        const userAns = userAnswersMap[q.id || q.qid];
        if (userAns && userAns === q.correct_answer) {
            correctCount++;
        }
    });

    const total = test.totalQuestions || questions.length;
    const accuracy = total > 0 ? (correctCount / total) * 100 : 0;
    const incorrectCount = Object.keys(userAnswersMap).length - correctCount;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* We wrap the existing interface but might need to inject custom return handlers */}
            <TestResultInterface
                test={test}
                userAnswers={userAnswersMap}
                score={Math.round(accuracy)}
                accuracy={accuracy}
                timeTaken={"Completed"}
                attemptedQuestions={Object.keys(userAnswersMap).length}
                totalQuestions={total}
                correctAnswers={correctCount}
                incorrectAnswers={incorrectCount}
                onReturnToDashboard={onExit}
            />
            {/* Overlay or custom buttons if needed, but TestResultInterface usually handles it. 
                We might need to customize the buttons in TestResultInterface or accept overrides.
            */}
        </div>
    );
}
