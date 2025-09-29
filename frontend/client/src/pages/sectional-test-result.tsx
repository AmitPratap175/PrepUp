import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import TestResultInterface from "@/components/test-result-interface";
import type { PracticeTest, Question } from "@shared/schema";

interface ResultData {
  answers: Record<string, string>;
  questions: Question[];
  timeTaken: number;
}

export default function SectionalTestResultPage() {
  const { testId } = useParams<{ testId: string }>();
  const [resultData, setResultData] = useState<ResultData | null>(null);

  const { data: test, isLoading: isTestLoading } = useQuery<PracticeTest>({
    queryKey: [`/api/sectional-tests/${testId}`],
    enabled: !!testId,
  });

  useEffect(() => {
    const storedResults = localStorage.getItem(`sectionalTestResult-${testId}`);
    if (storedResults) {
      setResultData(JSON.parse(storedResults));
    }
  }, [testId]);

  if (isTestLoading || !resultData || !test) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading results...</div>
            <div className="text-muted-foreground">Please wait</div>
          </div>
        </div>
      </div>
    );
  }

  const { answers, timeTaken } = resultData;
  const questions = test.questions;

  const totalQuestions = questions.length;
  const attemptedQuestions = Object.keys(answers).length;
  const correctAnswers = questions.filter((q) => {
    const answer = answers[q.qid];
    if (!answer) return false;
    if (q.options.length > 0) {
      const option = q.options.find(o => o.data_option === answer);
      return option?.is_correct || false;
    } else {
      return answer === q.correct_option_data;
    }
  }).length;
  const incorrectAnswers = attemptedQuestions - correctAnswers;
  const accuracy =
    attemptedQuestions > 0 ? (correctAnswers / attemptedQuestions) * 100 : 0;
  const score = correctAnswers * 3 - incorrectAnswers * 1;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="h-screen bg-background flex flex-col">
        <main className="flex-grow">
            <TestResultInterface 
                test={test} 
                userAnswers={answers}
                score={score}
                accuracy={accuracy}
                timeTaken={formatTime(timeTaken)}
                attemptedQuestions={attemptedQuestions}
                totalQuestions={totalQuestions}
                correctAnswers={correctAnswers}
                incorrectAnswers={incorrectAnswers}
            />
        </main>
    </div>
  );
}
