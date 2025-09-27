import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import SectionalTestInterface from "@/components/sectional-test-interface";
import type { PracticeTest, TestSession } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * A page component for taking a sectional test.
 *
 * This component fetches the data for a specific sectional test based on its ID
 * from the URL and then renders the `SectionalTestInterface` to provide the
 * testing experience.
 *
 * @returns {JSX.Element} The rendered sectional test page.
 */
export default function SectionalTestPage() {
  const [, params] = useRoute("/sectional-test/:id");
  const testId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<TestSession | null>(null);

  const { data: test, isLoading } = useQuery<PracticeTest>({
    queryKey: [`/api/sectional-tests/${testId}`],
    enabled: !!testId,
  });

  const startTestMutation = useMutation({
    mutationFn: (newSession: Partial<TestSession>) =>
      apiRequest<TestSession>("POST", "/api/test-sessions/", newSession),
    onSuccess: (data) => {
      setSession(data);
      toast({
        title: "Test Started",
        description: "Your test session has begun. Good luck!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start test session. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (test && user && !session) {
      startTestMutation.mutate({
        testId: test.id,
        userId: user.id,
        testType: 'sectional',
        subject: test.subject,
        maxScore: test.totalQuestions * 3,
        totalQuestions: test.totalQuestions,
        answers: [],
      });
    }
  }, [test, user, session]);

  if (isLoading || startTestMutation.isPending) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading test...</div>
            <div className="text-muted-foreground">Please wait</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (!test || !session) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Test not found</div>
            <div className="text-muted-foreground">This test does not exist or could not be loaded.</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return <SectionalTestInterface testId={test.id} session={session} />;
}
