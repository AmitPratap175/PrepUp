import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { NewQuizInterface } from "@/components/NewQuizInterface";
import type { PracticeTest } from "@shared/schema";

export default function SectionalTestSectionPage() {
  const [, params] = useRoute("/sectional-test/:id/:section");
  const testId = params?.id;
  const section = params?.section;
  const [, navigate] = useLocation();

  const { data: test, isLoading } = useQuery<PracticeTest>({
    queryKey: [`/api/sectional-tests/${testId}/${section}`],
    enabled: !!testId && !!section,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Loading test section...</div>
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
            <div className="text-lg font-semibold mb-2">Test section not found</div>
            <div className="text-muted-foreground">This test section does not exist or could not be loaded.</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  const handleExit = () => {
    //
    // By default, it will show a confirmation dialog
    navigate(`/sectional-test/${testId}`);
  };

  const handleSubmit = (userAnswers: any) => {
    navigate('/sectional-test-result', { state: { test, userAnswers } });
  };

  return <NewQuizInterface test={test} onExit={handleExit} onSubmit={handleSubmit} />;
}
