import { useState, useEffect } from "react";
import { useParams } from "wouter";
import Latex from "react-latex-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Question } from "@shared/schema";

interface ResultData {
  answers: Record<string, string>;
  questions: Question[];
  timeTaken: number;
}

export default function SectionalTestResultPage() {
  const { testId } = useParams<{ testId: string }>();
  const [resultData, setResultData] = useState<ResultData | null>(null);

  useEffect(() => {
    const storedResults = localStorage.getItem(
      `sectionalTestResult-${testId}`
    );
    if (storedResults) {
      setResultData(JSON.parse(storedResults));
    }
  }, [testId]);

  if (!resultData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Result not found</h2>
        <p className="text-muted-foreground">
          The result for this test could not be found.
        </p>
      </div>
    );
  }

  const { questions, answers, timeTaken } = resultData;

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

  const getOptionText = (question: Question, data_option: string | undefined, isCorrect: boolean = false) => {
    if (isCorrect) {
      const correctOption = question.options.find(o => o.is_correct);
      return correctOption ? correctOption.option_text : "N/A";
    }
    if (!data_option) return "Not Answered";
    const option = question.options.find(o => o.data_option === data_option);
    return option ? option.option_text : "N/A";
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Test Result: {testId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-2xl font-bold">{score}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="text-2xl font-bold">{accuracy.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time Taken</p>
              <p className="text-2xl font-bold">{formatTime(timeTaken)}</p>
            </div>
          </div>
          <div className="mt-6">
            <Progress value={(attemptedQuestions / totalQuestions) * 100} />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>
                Attempted: {attemptedQuestions}/{totalQuestions}
              </span>
              <span>
                Correct: {correctAnswers} | Incorrect: {incorrectAnswers}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Question Review</h2>
      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={question.qid}>
            <CardHeader>
                <p className="font-bold"><Latex>{`Question ${index + 1}: ${question.question_text}`}</Latex></p>
            </CardHeader>
            <CardContent>
              {question.options.length > 0 ? (
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const isSelected = answers[question.qid] === option.data_option;
                    const isCorrect = option.is_correct;

                    let bgClass = "bg-transparent";
                    if (isSelected && isCorrect) {
                      bgClass = "bg-green-100";
                    } else if (isSelected && !isCorrect) {
                      bgClass = "bg-red-100";
                    } else if (isCorrect) {
                      bgClass = "bg-green-100";
                    }

                    return (
                      <div key={option.data_option} className={`p-2 rounded-lg ${bgClass}`}>
                        <Latex>{`${option.label}. ${option.option_text}`}</Latex>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <p>Your answer: {answers[question.qid] || "Not Answered"}</p>
                  <p>Correct answer: {question.correct_option_data}</p>
                </div>
              )}
              {question.options.length > 0 && (
                <div className="mt-4">
                  <p>Your answer: <Latex>{getOptionText(question, answers[question.qid])}</Latex></p>
                  <p>Correct answer: <Latex>{getOptionText(question, undefined, true)}</Latex></p>
                </div>
              )}
              {question.explanation && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Explanation</h4>
                  <div className="prose max-w-none">
                    <Latex>{question.explanation}</Latex>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
