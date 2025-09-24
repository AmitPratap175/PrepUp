import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import MockTestInterface from "@/components/mock-test-interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PracticeTest, UserAnswer } from "@shared/schema";

/**
 * Renders a page that lists all available mock tests.
 *
 * This component fetches and displays a list of mock tests, allowing users
 * to select one to start. When a test is started, the user is navigated

* to the mock test interface.
 *
 * @returns {JSX.Element} The rendered mock tests page.
 */
export default function MockTestsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const { data: mockTests, isLoading } = useQuery<PracticeTest[]>({
    queryKey: ["/api/mock-tests"],
  });

  const handleStartTest = (testId: string) => {
    setSelectedTestId(testId);
    navigate(`/mock-test/${testId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading mock tests...</div>
            <div className="text-muted-foreground">Please wait</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Mock Tests
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Prepare for the real exam with our full-length mock tests.
            </p>
          </div>

          {mockTests && mockTests.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mockTests.map((test) => (
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
                      data-testid={`start-test-${test.id}`}
                    >
                      Start Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">quiz</span>
                <h3 className="text-xl font-semibold mb-2">No Mock Tests Available</h3>
                <p className="text-muted-foreground mb-6">
                  Mock tests are currently being prepared. Please check back soon!
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
