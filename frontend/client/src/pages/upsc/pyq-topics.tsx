import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, List, ArrowRight, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import type { PracticeTest } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

export default function UPSCPYQTopicsPage() {
    const { data: tests, isLoading } = useQuery<PracticeTest[]>({
        queryKey: ["/api/practice-tests?examType=upsc"],
    });

    const topicMetadata = [
        {
            id: "upsc-polity-pyqs-complete",
            title: "Polity PYQs",
            description: "Constitution, Governance, and Political System (25 Years).",
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            borderColor: "border-blue-200"
        },
        {
            id: "upsc-ancient-history-pyqs",
            title: "Ancient & Medieval History",
            description: "Art, Culture, and Historical Developments.",
            color: "text-amber-600",
            bgColor: "bg-amber-100",
            borderColor: "border-amber-200"
        },
        {
            id: "upsc-modern-history-pyqs",
            title: "Modern Indian History",
            description: "Freedom Struggle and Modern India.",
            color: "text-orange-600",
            bgColor: "bg-orange-100",
            borderColor: "border-orange-200"
        },
        {
            id: "upsc-geography-pyqs",
            title: "Geography",
            description: "Physical, Indian, and World Geography.",
            color: "text-emerald-600",
            bgColor: "bg-emerald-100",
            borderColor: "border-emerald-200"
        },
        {
            id: "upsc-economy-pyqs",
            title: "Economy",
            description: "Indian Economy, Budget, and Development.",
            color: "text-indigo-600",
            bgColor: "bg-indigo-100",
            borderColor: "border-indigo-200"
        },
        {
            id: "upsc-environment-pyqs",
            title: "Environment & Ecology",
            description: "Conservation, Biodiversity, and Climate Change.",
            color: "text-green-600",
            bgColor: "bg-green-100",
            borderColor: "border-green-200"
        },
        {
            id: "upsc-science-tech-pyqs",
            title: "Science & Technology",
            description: "General Science and Recent Developments.",
            color: "text-cyan-600",
            bgColor: "bg-cyan-100",
            borderColor: "border-cyan-200"
        },
        {
            id: "upsc-misc-pyqs",
            title: "Misc & Current Affairs",
            description: "Schemes, Organizations, and International Relations.",
            color: "text-slate-600",
            bgColor: "bg-slate-100",
            borderColor: "border-slate-200"
        }
    ];

    const { user } = useAuth();

    // Fetch user sessions to check completion status
    const { data: sessions } = useQuery<any[]>({
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

    const sessionsMap = new Map(sessions?.map(s => [s.testId, s]));

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Link href="/upsc" className="hover:text-primary transition-colors">UPSC</Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">PYQs</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Topic-wise PYQs</h1>
                        <p className="text-xl text-muted-foreground">
                            Master each subject with our curated topic-wise previous year questions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topicMetadata.map((meta) => {
                            const foundTest = tests?.find(t => t.id === meta.id);
                            const isAvailable = !!foundTest;
                            const count = foundTest?.totalQuestions || 0;

                            const session = sessionsMap.get(meta.id);
                            const isCompleted = session?.status === 'completed' || !!session?.score;

                            return (
                                <Card
                                    key={meta.id}
                                    className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-t-4 ${meta.borderColor}`}
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className={`p-3 rounded-xl ${meta.bgColor} ${meta.color}`}>
                                                <BookOpen className="h-6 w-6" />
                                            </div>
                                        </div>
                                        <CardTitle className="mt-4 text-xl">{meta.title}</CardTitle>
                                        <CardDescription className="mt-2 line-clamp-2">
                                            {meta.description}
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
                                                    'Coming Soon'
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                {isAvailable ? (
                                                    <>
                                                        {isCompleted ? (
                                                            <Link href={`/upsc/result/${session.id}`}>
                                                                <Button size="sm" variant="outline">
                                                                    Result
                                                                </Button>
                                                            </Link>
                                                        ) : null}
                                                        <Link href={`/upsc/test/${meta.id}`}>
                                                            <Button size="sm" className={!isCompleted ? "group-hover:translate-x-1 transition-transform" : ""} variant={isCompleted ? "secondary" : "default"}>
                                                                {isCompleted ? "Retake" : "Start"} {(!isCompleted) && <ArrowRight className="ml-2 h-4 w-4" />}
                                                            </Button>
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <Button variant="secondary" disabled size="sm">Coming Soon</Button>
                                                )}
                                            </div>
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
