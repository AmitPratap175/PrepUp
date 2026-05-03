import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Clock, Brain, CheckCircle2, RotateCcw, List, Bookmark as BookmarkIcon, Map as MapIcon } from "lucide-react";
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

export default function UPSCPage() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();

    const { data: tests, isLoading: isLoadingTests } = useQuery<PracticeTest[]>({
        queryKey: ["/api/practice-tests?examType=upsc"],
    });

    const { data: sessions, isLoading: isLoadingSessions } = useQuery<TestSession[]>({
        queryKey: ["/api/users/me/test-sessions/"],
        queryFn: async () => {
            const response = await fetch(`/api/users/${user?.id}/test-sessions/`, {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (!response.ok) return [];
            return response.json();
        },
        enabled: !!user
    });

    const { data: revisions, isLoading: isLoadingRevisions } = useQuery<any[]>({
        queryKey: ["/api/revision/?subject=Current Affairs"],
        queryFn: async () => {
            const response = await fetch(`/api/revision/?subject=Current Affairs`, {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (!response.ok) return [];
            return response.json();
        },
        enabled: !!user
    });

    const upscTests = tests || [];
    const sessionsMap = new Map(sessions?.map(s => [s.testId, s]));

    const getTestStatus = (testId: string) => {
        const session = sessionsMap.get(testId);
        if (!session) return null;
        return session;
    }

    const handleStartRevision = () => {
        setLocation('/upsc/revision');
    };

    const handleRetake = (testId: string) => {
        // For now, just link to test, backend/frontend should handle new session creation or overwrite
        setLocation(`/upsc/test/${testId}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col gap-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">UPSC Preparation</h1>
                        <p className="text-xl text-muted-foreground">
                            Master the Civil Services Examination with our daily current affairs MCQs and comprehensive study materials.
                        </p>
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="mb-8">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                            <TabsTrigger value="revision">Revision</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-primary" />
                                            Daily MCQs
                                        </CardTitle>
                                        <CardDescription>Fresh questions every day from top news sources.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-3xl font-bold">{upscTests.length}</p>
                                        <p className="text-sm text-muted-foreground">Available Sets</p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-indigo-500/5 border-indigo-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <List className="h-5 w-5 text-indigo-500" />
                                            Monthly MCQs
                                        </CardTitle>
                                        <CardDescription>Comprehensive monthly current affairs tests.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/upsc/monthly-mcq-questions">
                                            <Button className="w-full" variant="outline">View Topics</Button>
                                        </Link>
                                    </CardContent>
                                </Card>

                                <Card className="bg-blue-500/5 border-blue-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Brain className="h-5 w-5 text-blue-500" />
                                            Smart Revision
                                        </CardTitle>
                                        <CardDescription>Personalized review sessions based on your performance.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-3xl font-bold">{revisions?.length || 0}</p>
                                                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                                            </div>
                                            {revisions && revisions.length > 0 && (
                                                <Button size="sm" onClick={handleStartRevision} >Review Now</Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-green-500/5 border-green-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-green-500" />
                                            Study Materials
                                        </CardTitle>
                                        <CardDescription>Curated notes and summaries for GS papers.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button variant="outline" className="w-full" disabled>Coming Soon</Button>
                                    </CardContent>
                                    <CardContent>
                                        <Button variant="outline" className="w-full" disabled>Coming Soon</Button>
                                    </CardContent>
                                </Card>

                                <Card className="bg-amber-500/5 border-amber-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <List className="h-5 w-5 text-amber-500" />
                                            Topic-wise PYQs
                                        </CardTitle>
                                        <CardDescription>Practice past year questions by subject (Polity, History, etc.).</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/upsc/topics">
                                            <Button className="w-full" variant="outline">View Topics</Button>
                                        </Link>
                                    </CardContent>
                                </Card>

                                <Card className="bg-cyan-500/5 border-cyan-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-cyan-500" />
                                            Year-wise Papers
                                        </CardTitle>
                                        <CardDescription>Attempt full length Prelims papers (2015-2025).</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/upsc/years">
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
                                        <CardDescription>Review your saved questions.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/upsc/bookmarks">
                                            <Button className="w-full" variant="outline">Go to Bookmarks</Button>
                                        </Link>
                                    </CardContent>
                                </Card>

                                <Card className="bg-rose-500/5 border-rose-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <MapIcon className="h-5 w-5 text-rose-500" />
                                            Map Master
                                        </CardTitle>
                                        <CardDescription>Interactive map quizzes and political borders.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/upsc/map-master">
                                            <Button className="w-full" variant="outline">Open Map</Button>
                                        </Link>
                                    </CardContent>
                                </Card>

                                <Card className="bg-emerald-500/5 border-emerald-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Brain className="h-5 w-5 text-emerald-500" />
                                            UPSC 2027 Mastery
                                        </CardTitle>
                                        <CardDescription>Comprehensive tracking, execution hub, and backlog management.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href="/upsc/mastery-2027">
                                            <Button className="w-full" variant="outline">Open Dashboard</Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="quizzes" className="space-y-6">
                            {/* Master Quiz Section */}
                            {upscTests.find(t => t.id === "upsc-master-quiz") && (
                                <section>
                                    <h2 className="text-2xl font-bold mb-4">Complete Question Bank</h2>
                                    <Card className="hover-elevate transition-all border-primary/20 bg-primary/5">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-xl">UPSC Master Question Bank</CardTitle>
                                                    <CardDescription>All 3000+ Questions in one place</CardDescription>
                                                </div>
                                                <Badge className="bg-primary text-primary-foreground">MASTER</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-6 mb-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">quiz</span>
                                                    <span>{upscTests.find(t => t.id === "upsc-master-quiz")?.totalQuestions} Questions</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">schedule</span>
                                                    <span>{upscTests.find(t => t.id === "upsc-master-quiz")?.duration} mins</span>
                                                </div>
                                            </div>
                                            <Link href={`/upsc/test/upsc-master-quiz`}>
                                                <Button className="w-full sm:w-auto">Start Master Quiz</Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                </section>
                            )}

                            {/* Daily Quizzes Section */}
                            <section>
                                <h2 className="text-2xl font-bold mb-4">Daily Current Affairs Sets</h2>
                                {isLoadingTests || isLoadingSessions ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : upscTests.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {upscTests
                                            .filter(t => t.id !== "upsc-master-quiz")
                                            .sort((a, b) => {
                                                // Sort by Set ID number (extract from title "UPSC Daily Quiz #X")
                                                const getNum = (s: string) => parseInt(s.match(/#(\d+)/)?.[1] || "0");
                                                return getNum(a.title) - getNum(b.title);
                                            })
                                            .map((test) => {
                                                const session = getTestStatus(test.id);
                                                const isCompleted = session?.status === 'completed' || !!session?.score; // Checking score presence as fallback
                                                return (
                                                    <Card key={test.id} className={`hover-elevate transition-all flex flex-col h-full ${isCompleted ? 'border-green-200 bg-green-50/30' : ''}`}>
                                                        <CardHeader className="pb-3">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <Badge variant="outline" className="font-mono">SET {test.title.split('#')[1]}</Badge>
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
                                                                        <Link href={`/upsc/result/${session.id}`} className="flex-1">
                                                                            <Button variant="outline" className="w-full">Result</Button>
                                                                        </Link>
                                                                        <Button variant="outline" size="icon" onClick={() => handleRetake(test.id)} title="Retake Quiz">
                                                                            <RotateCcw className="h-4 w-4" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Link href={`/upsc/test/${test.id}`} className="w-full">
                                                                        <Button className="w-full" variant={session ? "secondary" : "default"}>
                                                                            {session ? "Resume Quiz" : "Start Daily Quiz"}
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
                                    <Card className="p-12 text-center">
                                        <p className="text-muted-foreground">No UPSC quizzes available yet. Please run the scraper to fetch latest questions.</p>
                                    </Card>
                                )}
                            </section>
                        </TabsContent>

                        <TabsContent value="revision" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Brain className="h-5 w-5 text-primary" />
                                        Spaced Repetition Review
                                    </CardTitle>
                                    <CardDescription>
                                        Review questions you missed previously to strengthen your memory.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingRevisions ? (
                                        <div className="flex justify-center p-4">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        </div>
                                    ) : revisions && revisions.length > 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl font-bold text-primary mb-2">{revisions.length}</div>
                                            <p className="text-muted-foreground mb-6">Questions pending for review today</p>
                                            <Button size="lg" onClick={handleStartRevision} className="gap-2">
                                                <Brain className="h-4 w-4" /> Start Revision Session
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                            <p>All caught up! No questions due for revision today.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
