import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              {test.title}
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              This test consists of three sections. Each section has a time limit of 40 minutes.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Verbal Ability</CardTitle>
                <CardDescription>40 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate(`/sectional-test/${testId}/varc`)}>
                  Start VARC Section
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DILR</CardTitle>
                <CardDescription>40 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate(`/sectional-test/${testId}/dilr`)}>
                  Start DILR Section
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quantitative Aptitude</CardTitle>
                <CardDescription>40 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => navigate(`/sectional-test/${testId}/quants`)}>
                  Start Quants Section
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
