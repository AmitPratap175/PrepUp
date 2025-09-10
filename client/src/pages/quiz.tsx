import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { QuizInterface } from "@/components/quiz-interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { PracticeTest, TestSession } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";

export default function QuizPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [session, setSession] = useState<TestSession | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

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

  const handleStartQuiz = async (testId: string) => {
    if (!user) return; // Or prompt to login

    setSelectedTestId(testId);
    const test = practiceTests?.find(t => t.id === testId);
    if (!test) return;

    try {
      const existingSession = await apiClient.post<TestSession>("/test-sessions", {
        userId: user.id,
        testId: test.id,
        totalQuestions: test.totalQuestions,
        answers: [],
      });

      if (existingSession.answers && Object.keys(existingSession.answers).length > 0 && !existingSession.isCompleted) {
        setSession(existingSession);
        setShowResumeDialog(true);
      } else {
        setSession(existingSession);
        setQuizStarted(true);
      }
    } catch (error) {
      console.error("Failed to start quiz session:", error);
    }
  };

  const handleResume = () => {
    setShowResumeDialog(false);
    setQuizStarted(true);
  };

  const handleStartAgain = async () => {
    if (!user || !selectedTestId) return;

    const test = practiceTests?.find(t => t.id === selectedTestId);
    if (!test) return;

    try {
      const newSession = await apiClient.post<TestSession>(`/test-sessions?force=true`, {
        userId: user.id,
        testId: selectedTestId,
        totalQuestions: test.totalQuestions,
        answers: [],
      });
      setSession(newSession);
      setShowResumeDialog(false);
      setQuizStarted(true);
    } catch (error) {
      console.error("Failed to start new quiz session:", error);
    }
  };

  const handleExitQuiz = () => {
    setQuizStarted(false);
    setSelectedTestId(null);
    setLocation("/quiz");
  };

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

  if (quizStarted && currentTest && session) {
    return <QuizInterface test={currentTest} session={session} onExit={handleExitQuiz} />;
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

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Quiz?</DialogTitle>
            <DialogDescription>
              You have an incomplete quiz session. Would you like to resume where you left off or start a new session?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleStartAgain}>Start Again</Button>
            <Button onClick={handleResume}>Resume</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
