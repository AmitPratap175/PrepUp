import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Clock, Brain } from "lucide-react";
import { Link } from "wouter";
import type { PracticeTest } from "@shared/schema";

export default function UPSCPage() {
    const { data: tests, isLoading } = useQuery<PracticeTest[]>({
        queryKey: ["/api/tests/practice"],
    });

    const upscTests = tests?.filter(t => t.examType === "upsc") || [];

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

                    <section>
                        <h2 className="text-2xl font-bold mb-4">Daily Current Affairs MCQs</h2>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : upscTests.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upscTests.map((test) => (
                                    <Card key={test.id} className="hover-elevate transition-all">
                                        <CardHeader>
                                            <CardTitle>{test.title}</CardTitle>
                                            <CardDescription>{test.subject}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-sm text-muted-foreground">{test.totalQuestions} Questions</span>
                                                <span className="text-sm text-muted-foreground font-medium">{test.duration} mins</span>
                                            </div>
                                            <Link href={`/upsc/test/${test.id}`}>
                                                <Button className="w-full">Start Quiz</Button>
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
                </div>
            </main>
        </div>
    );
}
