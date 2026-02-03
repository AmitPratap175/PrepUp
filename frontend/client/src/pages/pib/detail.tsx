import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute } from "wouter";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Link, useLocation } from "wouter";
import { Loader2, ArrowLeft, PenTool } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
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
                                    <ReactMarkdown>{mq.answer}</ReactMarkdown>
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

    const { data: release, isLoading } = useQuery<PIBReleaseDetail>({
        queryKey: ["pib-release", id],
        queryFn: async () => {
            const res = await fetch(`/api/pib/releases/${id}/`);
            if (!res.ok) throw new Error("Failed to fetch release");
            return res.json();
        },
        enabled: !!id,
    });

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AppHeader />
            <main className="container mx-auto px-4 py-8 max-w-4xl">
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

                        <div className="grid md:grid-cols-[2fr,1fr] gap-8">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="prose dark:prose-invert max-w-none">
                                        <ReactMarkdown>{release.summary || "*No summary available.*"}</ReactMarkdown>
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
                    </div>
                )}
            </main>
        </div>
    );
}
