import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { PracticeTestInterface } from "@/components/practice-test-interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PracticeTest, UserAnswer } from "@shared/schema";

export default function PracticeTestPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);

  // Extract test ID from URL if provided
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const testIdFromUrl = urlParams.get('testId');
  const questionIdFromUrl = urlParams.get('question');
  const examTypeFromUrl = urlParams.get('exam');

  useEffect(() => {
    if (testIdFromUrl) {
      setSelectedTestId(testIdFromUrl);
      setTestStarted(true);
    }
  }, [testIdFromUrl]);

  const { data: practiceTests, isLoading } = useQuery<PracticeTest[]>({
    queryKey: ["/api/practice-tests", ...(examTypeFromUrl ? [`?examType=${examTypeFromUrl}`] : [])],
  });

  const { data: currentTest } = useQuery<PracticeTest>({
    queryKey: ["/api/practice-tests", selectedTestId || testIdFromUrl].filter(Boolean),
    enabled: !!(selectedTestId || testIdFromUrl),
  });

  const startTestMutation = useMutation({
    mutationFn: async ({ testId, userId }: { testId: string; userId: string }) => {
      return apiRequest("POST", "/api/test-sessions", {
        testId,
        userId,
        totalQuestions: currentTest?.totalQuestions || 0,
        answers: [],
      });
    },
    onSuccess: () => {
      setTestStarted(true);
      toast({
        title: "Test Started",
        description: "Your test session has begun. Good luck!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start test. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitTestMutation = useMutation({
    mutationFn: async ({ answers, timeSpent }: { answers: UserAnswer[]; timeSpent: number }) => {
      // In a real app, we'd update the existing test session
      // For now, we'll just log the results
      console.log("Test submitted:", { answers, timeSpent });
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/test-sessions"] });
      toast({
        title: "Test Submitted",
        description: "Your test has been submitted successfully!",
      });
      setTestStarted(false);
      setSelectedTestId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit test. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartTest = (testId: string) => {
    setSelectedTestId(testId);
    // In a real app, we'd get the user ID from authentication context
    const mockUserId = "user-123";
    startTestMutation.mutate({ testId, userId: mockUserId });
  };

  const handleSubmitTest = (answers: UserAnswer[], timeSpent: number) => {
    submitTestMutation.mutate({ answers, timeSpent });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading practice tests...</div>
            <div className="text-muted-foreground">Please wait</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  // If test is started and we have a current test, show the test interface
  if (testStarted && currentTest) {
    return (
      <PracticeTestInterface 
        test={currentTest} 
        onSubmit={handleSubmitTest}
        initialQuestionId={questionIdFromUrl}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Practice Tests
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Test your knowledge with our comprehensive practice tests designed to simulate real exam conditions.
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
                        {test.duration} mins
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{test.title}</CardTitle>
                    <CardDescription>
                      {test.subject} • {test.totalQuestions} Questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        <span>{test.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined text-primary">quiz</span>
                        <span>{test.totalQuestions} questions</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined text-primary">subject</span>
                        <span>{test.subject}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handleStartTest(test.id)}
                      disabled={startTestMutation.isPending}
                      data-testid={`start-test-${test.id}`}
                    >
                      {startTestMutation.isPending ? 'Starting...' : 'Start Test'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">quiz</span>
                <h3 className="text-xl font-semibold mb-2">No Practice Tests Available</h3>
                <p className="text-muted-foreground mb-6">
                  Practice tests are currently being prepared. Please check back soon!
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
