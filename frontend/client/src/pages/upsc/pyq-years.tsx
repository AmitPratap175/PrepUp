import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, List, ArrowRight, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import type { PracticeTest } from "@shared/schema";

export default function UPSCYearWisePage() {
    const { data: tests, isLoading } = useQuery<PracticeTest[]>({
        queryKey: ["/api/practice-tests?examType=upsc-prelims"],
    });

    const years = Array.from({ length: 2025 - 2015 + 1 }, (_, i) => 2025 - i); // 2025 down to 2015

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Link href="/upsc" className="hover:text-primary transition-colors">UPSC</Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">Year-wise PYQs</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-4">UPSC Prelims (Year-wise)</h1>
                        <p className="text-xl text-muted-foreground">
                            Attempt previous year prelims papers (2015-2025) in clear 2-hour simulated environment.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {years.map((year) => {
                            const testId = `upsc-prelims-${year}`;
                            const foundTest = tests?.find(t => t.id === testId);
                            const isAvailable = !!foundTest;
                            const count = foundTest?.totalQuestions || 0;

                            return (
                                <Card
                                    key={year}
                                    className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-t-4 ${isAvailable ? 'border-primary' : 'border-muted'}`}
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className={`p-3 rounded-xl ${isAvailable ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                <Calendar className="h-6 w-6" />
                                            </div>
                                        </div>
                                        <CardTitle className="mt-4 text-xl">Prelims {year} (GS-1)</CardTitle>
                                        <CardDescription className="mt-2 text-sm">
                                            General Studies Paper 1
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <List className="mr-2 h-4 w-4" />
                                                {isLoading ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : isAvailable ? (
                                                    `${count} Questions`
                                                ) : (
                                                    'Not Scraped'
                                                )}
                                            </div>
                                            {isAvailable ? (
                                                <Link href={`/upsc/test/${testId}`}>
                                                    <Button className="group-hover:translate-x-1 transition-transform">
                                                        Start Test <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Button variant="secondary" disabled size="sm">Coming Soon</Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
