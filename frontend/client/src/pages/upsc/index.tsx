import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Clock, Brain } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PracticeTest } from "@shared/schema";

export default function UPSCPage() {
    const { data: tests, isLoading } = useQuery<PracticeTest[]>({
        queryKey: ["/api/practice-tests?examType=upsc"],
    });

    const upscTests = tests || [];

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

                                <Card className="bg-blue-500/5 border-blue-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Brain className="h-5 w-5 text-blue-500" />
                                            Smart Revision
                                        </CardTitle>
                                        <CardDescription>Personalized review sessions based on your performance.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button variant="outline" className="w-full" disabled>Coming Soon</Button>
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
                                {isLoading ? (
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
                                            .map((test) => (
                                                <Card key={test.id} className="hover-elevate transition-all flex flex-col h-full">
                                                    <CardHeader className="pb-3">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <Badge variant="outline" className="font-mono">SET {test.title.split('#')[1]}</Badge>
                                                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                                                                {test.duration} MINS
                                                            </Badge>
                                                        </div>
                                                        <CardTitle className="text-lg line-clamp-1">{test.title}</CardTitle>
                                                        <CardDescription className="line-clamp-1">{test.subject}</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="mt-auto pt-0">
                                                        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                                                            <span className="material-symbols-outlined text-base">list_alt</span>
                                                            <span>{test.totalQuestions} Questions</span>
                                                        </div>
                                                        <Link href={`/upsc/test/${test.id}`}>
                                                            <Button className="w-full" variant="outline">Start Daily Quiz</Button>
                                                        </Link>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                    </div>
                                ) : (
                                    <Card className="p-12 text-center">
                                        <p className="text-muted-foreground">No UPSC quizzes available yet. Please run the scraper to fetch latest questions.</p>
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
