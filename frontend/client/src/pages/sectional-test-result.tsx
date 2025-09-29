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

  let attemptedQuestions = 0;
  let correctAnswers = 0;

  questions.forEach(q => {
      const userAnswer = answers[q.qid];
      if (userAnswer != null) { // Answered
          attemptedQuestions++;
          let isCorrect = false;
          if (q.options.length > 0) {
              const correctOption = q.options.find(o => o.is_correct);
              if (correctOption && correctOption.data_option === userAnswer) {
                  isCorrect = true;
              }
          } else {
              if (userAnswer === q.correct_option_data) {
                  isCorrect = true;
              }
          }
          if (isCorrect) {
              correctAnswers++;
          }
      }
  });

  const totalQuestions = questions.length;
  const incorrectAnswers = attemptedQuestions - correctAnswers;
  const accuracy =
      attemptedQuestions > 0 ? (correctAnswers / attemptedQuestions) * 100 : 0;
  const score = correctAnswers * 3 - incorrectAnswers;

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
