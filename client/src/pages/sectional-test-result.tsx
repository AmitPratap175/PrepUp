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
import QuestionReview from "@/components/question-review";

interface ResultData {
  answers: Record<string, string>;
  questions: Question[];
  timeTaken: number;
}

export default function SectionalTestResultPage() {
  const { testId, section } = useParams<{ testId: string; section: string }>();
  const [resultData, setResultData] = useState<ResultData | null>(null);

  useEffect(() => {
    const storedResults = localStorage.getItem(
      `sectionalTestResult-${testId}-${section}`
    );
    if (storedResults) {
      setResultData(JSON.parse(storedResults));
    }
  }, [testId, section]);

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
  const correctAnswers = questions.filter(
    (q) => answers[q.qid] === q.correct_answer
  ).length;
  const incorrectAnswers = attemptedQuestions - correctAnswers;
  const accuracy =
    attemptedQuestions > 0 ? (correctAnswers / attemptedQuestions) * 100 : 0;
  const score = correctAnswers * 3 - incorrectAnswers;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getOptionText = (question: Question, data_option: string | undefined) => {
    if (!data_option) return "Not Answered";
    const option = question.options.find(o => o.data_option === data_option);
    return option ? option.option_text : "N/A";
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Test Result: {testId} - {section?.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center mb-8">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="text-3xl font-bold text-primary">{score}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="text-3xl font-bold text-green-500">{accuracy.toFixed(2)}%</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Time Taken</p>
              <p className="text-3xl font-bold">{formatTime(timeTaken)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Percentile</p>
              <p className="text-3xl font-bold">95. percentile</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Statistic</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total Questions</TableCell>
                <TableCell>{totalQuestions}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Attempted Questions</TableCell>
                <TableCell>{attemptedQuestions}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Correct Answers</TableCell>
                <TableCell className="text-green-600">{correctAnswers}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Incorrect Answers</TableCell>
                <TableCell className="text-red-600">{incorrectAnswers}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Unanswered Questions</TableCell>
                <TableCell>{totalQuestions - attemptedQuestions}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Question Review</h2>
      <div className="space-y-6">
        {questions.map((question, index) => (
          <QuestionReview
            key={question.qid}
            question={question}
            userAnswer={answers[question.qid]}
            questionIndex={index}
          />
        ))}
      </div>
    </div>
  );
}
