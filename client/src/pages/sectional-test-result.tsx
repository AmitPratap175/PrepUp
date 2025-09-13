import { useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PracticeTest, UserAnswer } from "@shared/schema";

export default function SectionalTestResultPage() {
  const [location, navigate] = useLocation();
  const { test, userAnswers } = (history.state?.usr || {}) as { test: PracticeTest; userAnswers: UserAnswer[] };

  if (!test || !userAnswers) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Result not found</div>
            <div className="text-muted-foreground">The result you are looking for does not exist or could not be loaded.</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  const correctAnswers = userAnswers.filter(answer => {
    const question = (test.questions as any[]).find(q => q.qid === answer.questionId);
    if (!question) return false;
    if (question.options.length > 0) {
      const correctOption = question.options.find((o: any) => o.is_correct);
      return correctOption && correctOption.data_option === answer.selectedAnswer;
    } else {
      return question.correct_option_data === answer.selectedAnswer;
    }
  }).length;

  const totalQuestions = (test.questions as any[]).length;
  const score = (correctAnswers / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Test Results
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              You scored {score.toFixed(2)}%
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>Correct Answers: {correctAnswers}</div>
                <div>Incorrect Answers: {totalQuestions - correctAnswers}</div>
                <div>Total Questions: {totalQuestions}</div>
                <div>Score: {score.toFixed(2)}%</div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Review Answers</h2>
            {(test.questions as any[]).map((question, index) => {
              const userAnswer = userAnswers.find(a => a.questionId === question.qid);
              const isCorrect = userAnswer ? (question.options.length > 0 ? question.options.find((o: any) => o.is_correct)?.data_option === userAnswer.selectedAnswer : question.correct_option_data === userAnswer.selectedAnswer) : false;
              return (
                <Card key={index} className="mb-4">
                  <CardHeader>
                    <CardTitle className={isCorrect ? 'text-green-500' : 'text-red-500'}>
                      Question {index + 1}: {isCorrect ? 'Correct' : 'Incorrect'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-bold">{question.question_text}</p>
                    <p>Your answer: {userAnswer?.selectedAnswer}</p>
                    <p>Correct answer: {question.options.length > 0 ? question.options.find((o: any) => o.is_correct)?.data_option : question.correct_option_data}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
