import { useState } from "react";
import Latex from "react-latex-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Question } from "@shared/schema";

interface QuestionReviewProps {
  question: Question;
  userAnswer: string | undefined;
  questionIndex: number;
}

export default function QuestionReview({ question, userAnswer, questionIndex }: QuestionReviewProps) {
  const [isAnswerShown, setIsAnswerShown] = useState(false);

  const getOptionText = (data_option: string | undefined) => {
    if (!data_option) return "Not Answered";
    const option = question.options.find(o => o.data_option === data_option);
    return option ? option.option_text : "N/A";
  }

  return (
    <Card>
      <CardHeader>
        <p className="font-bold"><Latex>{`Question ${questionIndex + 1}: ${question.question_text}`}</Latex></p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {question.options.map((option) => {
            const isSelected = userAnswer === option.data_option;
            const isCorrect = option.data_option === question.correct_answer;

            let bgClass = "bg-transparent";
            if (isAnswerShown) {
              if (isSelected && isCorrect) {
                bgClass = "bg-green-100";
              } else if (isSelected && !isCorrect) {
                bgClass = "bg-red-100";
              } else if (isCorrect) {
                bgClass = "bg-green-100";
              }
            } else {
                if (isSelected) {
                    bgClass = "bg-blue-100";
                }
            }

            return (
              <div key={option.data_option} className={`p-2 rounded-lg ${bgClass}`}>
                <Latex>{`${option.label}. ${option.option_text}`}</Latex>
              </div>
            );
          })}
        </div>

        {isAnswerShown && (
            <div className="mt-4">
                <p>Your answer: <Latex>{getOptionText(userAnswer)}</Latex></p>
                <p>Correct answer: <Latex>{getOptionText(question.correct_answer)}</Latex></p>
            </div>
        )}

        <div className="mt-4">
            <Button onClick={() => setIsAnswerShown(!isAnswerShown)}>
                {isAnswerShown ? "Hide Answer" : "Show Answer"}
            </Button>
        </div>

        {isAnswerShown && question.explanation && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Explanation</h4>
            <div className="prose max-w-none">
              <Latex>{question.explanation}</Latex>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
