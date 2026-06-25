import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute } from "wouter";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Link, useLocation, useRoute } from "wouter";
import { Loader2, ArrowLeft, PenTool, Maximize, Star, ChevronLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuizQuestion {
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
}

interface PIBReleaseDetail {
    id: string;
    title: string;
    ministry: string;
    date: string;
    content: string;
    summary: string;
    quiz_data: { quiz: QuizQuestion[] } | QuizQuestion[]; // Handle potential structure variations
    mains_questions: { question: string; answer: string; }[];

    original_url: string;
}

function MainsQuestionsCard({ questions, releaseId }: { questions: any[], releaseId: string }) {
    const [, setLocation] = useLocation();
    const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

    const handleStartEssay = async (idx: number) => {
        setLoadingIndex(idx);
        try {
            const res = await apiRequest("POST", `/api/pib/start-essay/${releaseId}/`, { question_index: idx });
            if (res.ok) {
                const data = await res.json();
                setLocation(`/mains-answer/${data.essay_id}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingIndex(null);
        }
    };

    return (
        <Card className="sticky top-24">
            <CardHeader>
                <CardTitle>Mains Answer Writing</CardTitle>
                <CardDescription>Practice answering these questions with AI review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {questions.map((mq, idx) => (
                    <div key={idx} className="space-y-2">
                        <p className="font-semibold text-sm">Q{idx + 1}. {mq.question}</p>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => handleStartEssay(idx)}
                            disabled={loadingIndex === idx}
                        >
                            {loadingIndex === idx ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PenTool className="h-4 w-4 mr-2" />}
                            Write Answer
                        </Button>

                        <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground mt-2">
                            <details>
                                <summary className="cursor-pointer hover:underline font-bold text-primary">View Model Approach</summary>
                                <div className="mt-2 whitespace-pre-line">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{mq.answer}</ReactMarkdown>
                                </div>
                            </details>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function PIBDetailPage() {
    const [, params] = useRoute("/upsc/pib/:id");
    const id = params?.id;
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isMaximized, setIsMaximized] = useState(false);

    const { data: release, isLoading } = useQuery<PIBReleaseDetail>({
        queryKey: ["pib-release", id],
        queryFn: async () => {
            const res = await fetch(`/api/pib/releases/${id}/`);
            if (!res.ok) throw new Error("Failed to fetch release");
            return res.json();
        },
        enabled: !!id,
    });

    const { data: allReleases = [] } = useQuery<PIBReleaseDetail[]>({
        queryKey: ["pib-releases-all"],
        queryFn: async () => {
            const res = await fetch(`/api/pib/releases/`);
            if (!res.ok) throw new Error("Failed to fetch all releases");
            const data = await res.json();
            return Array.isArray(data) ? data : data.results;
        },
    });

    const { data: bookmarks = [] } = useQuery<string[]>({
        queryKey: ["pib-bookmarks"],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            if (!token) return [];
            const res = await fetch("/api/pib/bookmarks/", {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch bookmarks");
            return res.json();
        },
    });

    const toggleBookmark = useMutation({
        mutationFn: async (prid: string) => {
            const token = localStorage.getItem('token');
            const res = await fetch("/api/pib/bookmarks/", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ prid }),
            });
            if (!res.ok) throw new Error("Failed to toggle bookmark");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pib-bookmarks"] });
        },
        onError: (error) => {
            toast({ title: "Bookmark Failed", description: error.message, variant: "destructive" });
        },
    });

    const currentIndex = allReleases.findIndex(r => r.id === id);
    const prevId = currentIndex > 0 ? allReleases[currentIndex - 1].id : null;
    const nextId = currentIndex >= 0 && currentIndex < allReleases.length - 1 ? allReleases[currentIndex + 1].id : null;
    const isBookmarked = id ? bookmarks.includes(id) : false;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AppHeader />
            <main className="mx-auto px-4 py-8" style={{ width: '85%', maxWidth: 'none' }}>
                <Link href="/upsc/pib">
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:underline flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to List
                    </Button>
                </Link>

                {isLoading || !release ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{release.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{release.ministry}</span>
                                <span>•</span>
                                <span>{release.date ? new Date(release.date).toLocaleDateString() : 'No date'}</span>
                                <span>•</span>
                                <a href={release.original_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Original Source</a>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-[3fr,1fr] gap-8">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle>Summary</CardTitle>
                                        <Button variant="ghost" size="icon" onClick={() => setIsMaximized(true)}>
                                            <Maximize className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="prose dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.summary || "*No summary available.*"}</ReactMarkdown>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Full Content</CardTitle>
                                    </CardHeader>
                                    <CardContent className="max-h-96 overflow-y-auto whitespace-pre-line text-sm text-muted-foreground">
                                        {release.content}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quiz</CardTitle>
                                        <CardDescription>Test your understanding with Prelims MCQs.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href={`/upsc/pib/${id}/quiz`}>
                                            <Button className="w-full">Start Interactive Quiz</Button>
                                        </Link>
                                    </CardContent>
                                </Card>

                                {release.mains_questions && release.mains_questions.length > 0 && (
                                    <MainsQuestionsCard
                                        questions={release.mains_questions}
                                        releaseId={release.id}
                                    />
                                )}
                            </div>
                        </div>

                        <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
                            <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col p-6">
                                <DialogHeader className="flex flex-row items-start justify-between pr-8">
                                    <div className="space-y-1">
                                        <DialogTitle className="text-2xl leading-tight">{release.title}</DialogTitle>
                                        <DialogDescription className="text-sm font-medium text-primary/80">
                                            {release.ministry || "Ministry of Information & Broadcasting"} • {release.date ? new Date(release.date).toLocaleDateString() : 'No date'}
                                        </DialogDescription>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={`absolute top-6 right-12 transition-colors ${isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-yellow-500'}`}
                                        onClick={(e) => { e.preventDefault(); if(id) toggleBookmark.mutate(id); }}
                                        disabled={toggleBookmark.isPending}
                                    >
                                        <Star className={`h-6 w-6 ${isBookmarked ? 'fill-current' : ''}`} />
                                    </Button>
                                </DialogHeader>
                                
                                <div className="flex-1 overflow-y-auto my-6 p-6 border rounded-lg bg-muted/10 shadow-inner">
                                    <div className="prose dark:prose-invert max-w-none prose-lg">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.summary || "*No summary available.*"}</ReactMarkdown>
                                    </div>
                                </div>
                                
                                <DialogFooter className="flex justify-between items-center sm:justify-between w-full border-t pt-4">
                                    <Button 
                                        variant="outline" 
                                        disabled={!prevId} 
                                        onClick={() => { if(prevId) setLocation(`/upsc/pib/${prevId}`); }}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-2" /> Previous Release
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        disabled={!nextId} 
                                        onClick={() => { if(nextId) setLocation(`/upsc/pib/${nextId}`); }}
                                    >
                                        Next Release <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </main>
        </div>
    );
}
