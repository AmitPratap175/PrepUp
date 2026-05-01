import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Clock, Brain, CheckCircle2, RotateCcw, List, Bookmark as BookmarkIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PracticeTest } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

interface TestSession {
    id: string;
    testId: string;
    score: number;
    status: 'completed' | 'in-progress';
    maxScore: number;
}

export default function SSCPage() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();

    const { data: tests, isLoading: isLoadingTests } = useQuery<PracticeTest[]>({
        queryKey: ["/api/practice-tests?examType=ssc"],
    });

    const { data: sessions, isLoading: isLoadingSessions } = useQuery<TestSession[]>({
        queryKey: ["/api/users/me/test-sessions/"],
        queryFn: async () => {
            if (!user) return [];
            const response = await fetch(`/api/users/${user?.id}/test-sessions/`, {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (!response.ok) return [];
            return response.json();
        },
        enabled: !!user
    });

    const sscTests = tests || [];
    const sessionsMap = new Map(sessions?.map(s => [s.testId, s]));

    const getTestStatus = (testId: string) => {
        const session = sessionsMap.get(testId);
        if (!session) return null;
        return session;
    }

    const handleRetake = (testId: string) => {
        setLocation(`/ssc/test/${testId}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col gap-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">SSC Preparation</h1>
                        <p className="text-xl text-muted-foreground">
                            Master the Staff Selection Commission exams with our comprehensive mock tests and previous year papers.
                        </p>
                    </div>

                    <Tabs defaultValue="quizzes" className="w-full">
                        <TabsList className="mb-8">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-primary" />
                                            SSC Practice Tests
                                        </CardTitle>
                                        <CardDescription>Full length and sectional practice sets.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{sscTests.length}</p>
                                        <p className="text-sm text-muted-foreground">Available Tests</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-amber-500/5 border-amber-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <List className="h-5 w-5 text-amber-500" />
                                            Year-wise Papers
                                        </CardTitle>
                                        <CardDescription>Attempt SSC papers from previous years.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/ssc/years">
                                            <Button className="w-full" variant="outline">View Papers</Button>
                                        </Link>
                                    </CardContent>
                                </Card>

                                <Card className="bg-purple-500/5 border-purple-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookmarkIcon className="h-5 w-5 text-purple-500" />
                                            Bookmarks
                                        </CardTitle>
                                        <CardDescription>Review your saved SSC questions.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/ssc/bookmarks">
                                            <Button className="w-full" variant="outline">Go to Bookmarks</Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="quizzes" className="space-y-6">
                            <section>
                                <h2 className="text-2xl font-bold mb-4">SSC CGL Practice Sets</h2>
                                {isLoadingTests || isLoadingSessions ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : sscTests.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {sscTests.map((test) => {
                                            const session = getTestStatus(test.id);
                                            const isCompleted = session?.status === 'completed' || !!session?.score;
                                            return (
                                                <Card key={test.id} className={`hover-elevate transition-all flex flex-col h-full ${isCompleted ? 'border-green-200 bg-green-50/30' : ''}`}>
                                                    <CardHeader className="pb-3">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <Badge variant="outline" className="font-mono">SSC EXAM</Badge>
                                                            {isCompleted ? (
                                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1">
                                                                    <CheckCircle2 className="h-3 w-3" /> Done
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                                    {test.duration} min
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <CardTitle className="text-lg line-clamp-1">{test.title}</CardTitle>
                                                        <CardDescription className="line-clamp-1">{test.subject}</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="mt-auto pt-0">
                                                        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                                                            <span className="material-symbols-outlined text-base">list_alt</span>
                                                            <span>{test.totalQuestions} Questions</span>
                                                            {session && (
                                                                <span className="ml-auto font-medium text-foreground">
                                                                    Score: {session.score}/{test.totalQuestions}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {isCompleted ? (
                                                                <>
                                                                    <Link href={`/ssc/result/${session.id}`} className="flex-1">
                                                                        <Button variant="outline" className="w-full">Result</Button>
                                                                    </Link>
                                                                    <Button variant="outline" size="icon" onClick={() => handleRetake(test.id)} title="Retake Quiz">
                                                                        <RotateCcw className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Link href={`/ssc/test/${test.id}`} className="w-full">
                                                                    <Button className="w-full" variant={session ? "secondary" : "default"}>
                                                                        {session ? "Resume Quiz" : "Start Test"}
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <Card className="p-12 text-center text-muted-foreground">
                                        No SSC quizzes available yet.
                                    </Card>
                                )}
                            </section>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
