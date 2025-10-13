import { Link } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { useQuery } from "@tanstack/react-query";
import type { Course, TestSession, UserProgress, PracticeTest } from "@shared/schema";

async function fetchDashboardData(url: string) {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json();
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses", { examType: user?.exam_type }],
    queryFn: () => fetchDashboardData(`/api/courses?examType=${user?.exam_type}`),
    enabled: !!user,
  });

  const { data: testSessions } = useQuery<TestSession[]>({
    queryKey: ["/api/users", user?.id, "test-sessions"],
    queryFn: () => fetchDashboardData(`/api/users/${user?.id}/test-sessions/`),
    enabled: !!user,
  });

  const { data: userProgress } = useQuery<UserProgress[]>({
    queryKey: ["/api/users", user?.id, "progress"],
    queryFn: () => fetchDashboardData(`/api/users/${user?.id}/progress/`),
    enabled: !!user,
  });

  const { data: studySummary } = useQuery<{ today_hours: number; week_summary: { date: string; hours: number }[] }>({
    queryKey: ["/api/users/study-summary", user?.id],
    queryFn: () => fetchDashboardData(`/api/auth/study-summary/`),
    enabled: !!user,
  });

  const { data: mockTests } = useQuery<PracticeTest[]>({
    queryKey: ["/api/mock-tests"],
    queryFn: () => fetchDashboardData(`/api/mock-tests/`),
  });

  // Calculate stats
  const totalTestsTaken = testSessions?.length || 0;
  const completedTests = testSessions?.filter(session => session.isCompleted).length || 0;
  const averageScore = completedTests > 0 
    ? Math.round((testSessions?.filter(s => s.isCompleted && s.score).reduce((sum, s) => sum + (s.score || 0), 0) || 0) / completedTests)
    : 0;

  const totalMockTests = mockTests?.length || 0;
  const mockTestsTaken = testSessions?.filter(s => s.testId.startsWith('mock-test')).length || 0;
  const mockTestsPercentage = totalMockTests > 0 ? (mockTestsTaken / totalMockTests) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Track Your Progress
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Monitor your learning journey with detailed analytics and personalized insights.
            </p>
          </div>

          {/* Dashboard Content */}
          <Card className="shadow-xl overflow-hidden">
            {/* Dashboard Header */}
            <div className="bg-gradient-to-r from-primary/20 to-accent p-6 border-b border-border">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground" data-testid="welcome-message">
                    Welcome back, {user?.name}!
                  </h2>
                  <p className="text-muted-foreground" data-testid="last-login">
                    Let's get started!
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground" data-testid="current-streak">
                      {(user as any)?.currentStreak || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="total-score">
                      {(user as any)?.totalScore || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Points</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Main Content */}
            <CardContent className="p-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Progress Overview */}
                <div className="lg:col-span-2">
                  <h3 className="font-semibold text-foreground mb-4">Progress Overview</h3>
                  
                  {/* Course Progress */}
                  <div className="space-y-4 mb-6">
                    {userProgress?.map((progress, index) => (
                      <Card key={index} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{courses?.find(c => c.id === progress.courseId)?.title}</span>
                            <span className="text-sm text-muted-foreground">{progress.progress}% Complete</span>
                          </div>
                          <Progress value={progress.progress} className="mb-2" data-testid={`progress-${index}`} />
                          <div className="text-xs text-muted-foreground">
                            Next: {progress.nextLesson}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Recent Test Scores */}
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Test Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {testSessions?.slice(0, 3).map((test, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground text-sm" data-testid={`test-name-${index}`}>
                                {test.testId}
                              </div>
                              <div className="text-xs text-muted-foreground">{test.subject}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary" data-testid={`test-score-${index}`}>
                                {test.score || 0}/{test.maxScore || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {test.score && test.maxScore ? Math.round((test.score / test.maxScore) * 100) : 0}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <Card className="text-center p-4 hover-elevate">
                      <CardContent className="p-0">
                        <div className="text-2xl font-bold text-primary" data-testid="total-tests">
                          {totalTestsTaken}
                        </div>
                        <div className="text-xs text-muted-foreground">Tests Taken</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center p-4 hover-elevate">
                      <CardContent className="p-0">
                        <div className="text-2xl font-bold text-primary" data-testid="completed-tests">
                          {completedTests}
                        </div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center p-4 hover-elevate">
                      <CardContent className="p-0">
                        <div className="text-2xl font-bold text-primary" data-testid="average-score">
                          {averageScore}%
                        </div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center p-4 hover-elevate">
                      <CardContent className="p-0">
                        <div className="text-2xl font-bold text-primary" data-testid="study-hours">
                          {studySummary?.today_hours || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Study Hours</div>
                      </CardContent>
                    </Card>
                  </div>
                  <AnalyticsCharts
                    weekSummary={studySummary?.week_summary}
                    testSessions={testSessions}
                    userProgress={userProgress}
                    courses={courses}
                    totalMockTests={totalMockTests}
                    mockTestsTaken={mockTestsTaken}
                  />
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href="/practice-test">
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-3 font-semibold transition-colors flex items-center gap-2 hover-elevate"
                        data-testid="quick-action-practice-test"
                      >
                        <span className="material-symbols-outlined">quiz</span>
                        Take Practice Test
                      </Button>
                    </Link>
                    <Link href="/study-materials">
                      <Button 
                        variant="outline"
                        className="w-full p-3 font-semibold transition-colors flex items-center gap-2 hover-elevate"
                        data-testid="quick-action-study-materials"
                      >
                        <span className="material-symbols-outlined">auto_stories</span>
                        Study Materials
                      </Button>
                    </Link>
                    <Button 
                      variant="outline"
                      className="w-full p-3 font-semibold transition-colors flex items-center gap-2 hover-elevate"
                      data-testid="quick-action-analytics"
                    >
                      <span className="material-symbols-outlined">analytics</span>
                      View Analytics
                    </Button>
                  </div>

                  {/* Study Schedule */}
                  <Card className="mt-6 bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-lg">Today's Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {/* This would come from a calendar or schedule API */}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Achievement Badge */}
                  <Card className="mt-6 bg-gradient-to-br from-primary/10 to-accent/20 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <span className="material-symbols-outlined text-3xl text-primary mb-2 block">
                        emoji_events
                      </span>
                      <h4 className="font-semibold text-foreground mb-1">15-Day Streak!</h4>
                      <p className="text-xs text-muted-foreground">
                        Keep up the great work. You're on fire! 🔥
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
