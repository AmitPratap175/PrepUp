import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import SectionalTestInterface from "@/components/sectional-test-interface";
import type { PracticeTest } from "@shared/schema";

export default function SectionalTestPage() {
  const [, params] = useRoute("/sectional-test/:id");
  const testId = params?.id;
  const [, navigate] = useLocation();

  const { data: test, isLoading } = useQuery<PracticeTest>({
    queryKey: [`/api/sectional-tests/${testId}`],
    enabled: !!testId,
  });

  if (isLoading) {
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

  if (!test) {
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

  const handleSubmit = (userAnswers: any) => {
    // In a real app, we would save the answers to the server
    // and then navigate to the results page.
    // For now, we'll just navigate to the results page with the answers.
    navigate(`/sectional-test/result/${testId}`, { state: { test, userAnswers } });
  };

  return <SectionalTestInterface testId={test.id} section={test.subject} />;
}
