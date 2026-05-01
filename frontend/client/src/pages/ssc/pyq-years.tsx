import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, List, ArrowRight, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import type { PracticeTest } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

export default function SSCYearWisePage() {
    const { data: tests, isLoading } = useQuery<PracticeTest[]>({
        queryKey: ["/api/practice-tests?examType=ssc"],
    });

    const { user } = useAuth();

    const { data: sessions } = useQuery<any[]>({
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

    const sessionsMap = new Map(sessions?.map(s => [s.testId, s]));

    // Group tests by year
    const testsByYear = (tests || []).reduce((acc: Record<string, PracticeTest[]>, test) => {
        const yearMatch = test.id.match(/ssc-(\d{4})-/);
        const year = yearMatch ? yearMatch[1] : 'Other';
        if (!acc[year]) acc[year] = [];
        acc[year].push(test);
        return acc;
    }, {});

    const years = Object.keys(testsByYear).sort((a, b) => b.localeCompare(a));

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Link href="/ssc" className="hover:text-primary transition-colors">SSC</Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">Year-wise PYQs</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-4">SSC Previous Year Papers</h1>
                        <p className="text-xl text-muted-foreground">
                            Practice with authentic SSC CGL papers from previous years.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : years.length > 0 ? (
                        years.map((year) => (
                            <section key={year} className="space-y-4">
                                <h2 className="text-2xl font-bold border-b pb-2">{year} Papers</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {testsByYear[year].map((test) => {
                                        const session = sessionsMap.get(test.id);
                                        const isCompleted = session?.status === 'completed' || !!session?.score;

                                        return (
                                            <Card
                                                key={test.id}
                                                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-t-4 border-primary`}
                                            >
                                                <CardHeader className="pb-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                                            <Calendar className="h-6 w-6" />
                                                        </div>
                                                    </div>
                                                    <CardTitle className="mt-4 text-lg line-clamp-2">{test.title}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center text-sm text-muted-foreground">
                                                            <List className="mr-2 h-4 w-4" />
                                                            {test.totalQuestions} Questions
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {isCompleted ? (
                                                                <Link href={`/ssc/result/${session.id}`}>
                                                                    <Button size="sm" variant="outline">
                                                                        Result
                                                                    </Button>
                                                                </Link>
                                                            ) : null}
                                                            <Link href={`/ssc/test/${test.id}`}>
                                                                <Button size="sm" className={!isCompleted ? "group-hover:translate-x-1 transition-transform" : ""} variant={isCompleted ? "secondary" : "default"}>
                                                                    {isCompleted ? "Retake" : "Start"} {(!isCompleted) && <ArrowRight className="ml-2 h-4 w-4" />}
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </section>
                        ))
                    ) : (
                        <Card className="p-12 text-center text-muted-foreground">
                            No year-wise papers discovered.
                        </Card>
                    )}
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
