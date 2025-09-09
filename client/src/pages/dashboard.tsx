import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { User, Course, TestSession, UserProgress } from "@shared/schema";

export default function Dashboard() {
  // In a real app, we'd get the user ID from authentication context
  const mockUserId = "user-123";

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", mockUserId],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: testSessions } = useQuery<TestSession[]>({
    queryKey: ["/api/users", mockUserId, "test-sessions"],
  });

  const { data: userProgress } = useQuery<UserProgress[]>({
    queryKey: ["/api/users", mockUserId, "progress"],
  });

  // Calculate stats
  const totalTestsTaken = testSessions?.length || 0;
  const completedTests = testSessions?.filter(session => session.isCompleted).length || 0;
  const averageScore = completedTests > 0 
    ? Math.round((testSessions?.filter(s => s.isCompleted && s.score).reduce((sum, s) => sum + (s.score || 0), 0) || 0) / completedTests)
    : 0;

  // Mock data for demonstration (this would come from the backend in a real app)
  const mockUserData = {
    name: "Priya",
    lastLogin: "Today, 2:30 PM",
    currentStreak: 15,
    totalScore: 1250,
  };

  const mockProgressData = [
    {
      courseName: "CAT Preparation",
      progress: 68,
      nextLesson: "Verbal Ability - Reading Comprehension"
    },
    {
      courseName: "GATE Electronics", 
      progress: 34,
      nextLesson: "Digital Circuits - Sequential Logic"
    }
  ];

  const mockRecentTests = [
    {
      name: "CAT Mock Test #15",
      subject: "Quantitative Aptitude",
      score: 85,
      maxScore: 100
    },
    {
      name: "GATE Mock Test #8",
      subject: "Digital Electronics", 
      score: 78,
      maxScore: 100
    }
  ];

  const mockSchedule = [
    { subject: "Math Practice", time: "10:00 AM" },
    { subject: "English Grammar", time: "2:00 PM" },
    { subject: "Mock Test", time: "4:00 PM" }
  ];

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
                    Welcome back, {user?.name || mockUserData.name}!
                  </h2>
                  <p className="text-muted-foreground" data-testid="last-login">
                    Last login: {mockUserData.lastLogin}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground" data-testid="current-streak">
                      {user?.currentStreak || mockUserData.currentStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="total-score">
                      {user?.totalScore || mockUserData.totalScore}
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
                    {mockProgressData.map((course, index) => (
                      <Card key={index} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{course.courseName}</span>
                            <span className="text-sm text-muted-foreground">{course.progress}% Complete</span>
                          </div>
                          <Progress value={course.progress} className="mb-2" data-testid={`progress-${index}`} />
                          <div className="text-xs text-muted-foreground">
                            Next: {course.nextLesson}
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
                        {mockRecentTests.map((test, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground text-sm" data-testid={`test-name-${index}`}>
                                {test.name}
                              </div>
                              <div className="text-xs text-muted-foreground">{test.subject}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary" data-testid={`test-score-${index}`}>
                                {test.score}/{test.maxScore}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round((test.score / test.maxScore) * 100)}%
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
                          42
                        </div>
                        <div className="text-xs text-muted-foreground">Study Hours</div>
                      </CardContent>
                    </Card>
                  </div>
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
                        {mockSchedule.map((item, index) => (
                          <div key={index} className="flex items-center justify-between" data-testid={`schedule-item-${index}`}>
                            <span className="text-foreground">{item.subject}</span>
                            <Badge variant="outline" className="text-primary border-primary">
                              {item.time}
                            </Badge>
                          </div>
                        ))}
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
