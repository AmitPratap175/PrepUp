import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import MockTestInterface from "@/components/mock-test-interface";
import type { PracticeTest, UserAnswer } from "@shared/schema";

export default function MockTestPage() {
  const [, params] = useRoute("/mock-test/:testId");
  const testId = params?.testId;

  const { data: currentTest, isLoading } = useQuery<PracticeTest>({
    queryKey: ["/api/mock-tests", testId].filter(Boolean),
    enabled: !!testId,
  });

  const handleSubmitTest = (answers: UserAnswer[], timeSpent: number) => {
    // Here you would typically send the results to the server
    console.log("Submitting test with answers:", answers, "and time spent:", timeSpent);
  };

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

  if (!currentTest) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Test not found.</div>
            <div className="text-muted-foreground">Please select a test to start.</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <MockTestInterface
      test={currentTest}
      onSubmit={handleSubmitTest}
    />
  );
}
