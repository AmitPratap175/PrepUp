import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Redirect } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { NewQuizInterface } from "@/components/NewQuizInterface";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PracticeTest, UserAnswer } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

/**
 * Renders a page for selecting and taking interactive quizzes.
 *
 * This component fetches a list of available quizzes (practice tests) and
 * allows an authenticated user to start one. When a quiz is started, it
 * renders the `NewQuizInterface` to provide the interactive quiz experience.
 *
 * @returns {JSX.Element} The rendered quiz selection or quiz interface page.
 */
export default function QuizPage() {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const queryClient = useQueryClient();

  // Extract test ID from URL if provided
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const testIdFromUrl = urlParams.get('testId');
  const examTypeFromUrl = urlParams.get('exam');

  const { data: practiceTests, isLoading } = useQuery<PracticeTest[]>({
    queryKey: ["/api/practice-tests", ...(examTypeFromUrl ? [`?examType=${examTypeFromUrl}`] : [])],
  });

  const { data: currentTest } = useQuery<PracticeTest>({
    queryKey: ["/api/practice-tests", selectedTestId || testIdFromUrl].filter(Boolean),
    enabled: !!(selectedTestId || testIdFromUrl),
  });

  const startSessionMutation = useMutation({
    mutationFn: (newSession: any) => {
      const token = localStorage.getItem('token');
      return fetch('/api/test-sessions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(newSession),
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setQuizStarted(true);
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: (updatedSession: any) => {
      const token = localStorage.getItem('token');
      return fetch(`/api/test-sessions/${sessionId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify(updatedSession),
      });
    },
    onSuccess: () => {
      console.log('Quiz progress updated, invalidating user-quiz-goals');
      queryClient.invalidateQueries({ queryKey: ['user-quiz-goals'] });
    },
  });

  const handleStartQuiz = (testId: string) => {
    setSelectedTestId(testId);
    if (!currentTest) return;

    startSessionMutation.mutate({
      testId: currentTest.id,
      startTime: new Date().toISOString(),
      totalQuestions: currentTest.totalQuestions,
      subject: currentTest.subject,
      maxScore: currentTest.totalQuestions,
    });
  };

  const handleProgressUpdate = (answers: UserAnswer[]) => {
    if (!sessionId) return;
    updateSessionMutation.mutate({ answers });
  };

  const handleSubmit = (answers: UserAnswer[]) => {
    if (!currentTest || !sessionId) return;

    const correctAnswers = answers.filter(answer => {
      const question = currentTest.questions.find(q => q.qid === answer.questionId);
      if (!question) return false;
      const correctOption = question.options.find(o => o.is_correct);
      return correctOption && correctOption.data_option === answer.selectedAnswer;
    }).length;

    updateSessionMutation.mutate({
      answers: answers,
      score: correctAnswers,
      correctAnswers: correctAnswers,
      status: 'completed',
      endTime: new Date().toISOString(),
    });

    handleExitQuiz();
  };

  const handleExitQuiz = () => {
    setQuizStarted(false);
    setSelectedTestId(null);
    setSessionId(null);
    setLocation("/quiz");
  };

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading quizzes...</div>
            <div className="text-muted-foreground">Please wait</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (quizStarted && currentTest) {
    return <NewQuizInterface test={currentTest} onExit={handleExitQuiz} onSubmit={handleSubmit} onProgressUpdate={handleProgressUpdate} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Quizzes
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Learn and practice with our interactive quizzes. Get immediate feedback on your answers.
            </p>
          </div>

          {practiceTests && practiceTests.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {practiceTests.map((test) => (
                <Card key={test.id} className="hover:shadow-lg transition-all duration-300 hover-elevate">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">
                        {test.examType.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {test.totalQuestions} Questions
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{test.title}</CardTitle>
                    <CardDescription>
                      {test.subject}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handleStartQuiz(test.id)}
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">quiz</span>
                <h3 className="text-xl font-semibold mb-2">No Quizzes Available</h3>
                <p className="text-muted-foreground mb-6">
                  Quizzes are currently being prepared. Please check back soon!
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
