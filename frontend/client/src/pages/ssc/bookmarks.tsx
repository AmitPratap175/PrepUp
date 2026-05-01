import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import MockTestInterface from "@/components/mock-test-interface";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocalResultView } from "@/components/local-result-view";
import type { PracticeTest, Question, Bookmark, UserAnswer } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Redirect, Link, useLocation } from "wouter";
import { Loader2, Download, Bookmark as BookmarkIcon, ChevronLeft } from "lucide-react";

interface BookmarkedQuestions {
    [subject: string]: Question[];
}

export default function SSCBookmarksPage() {
    const { isAuthenticated } = useAuth();
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [submittedAnswers, setSubmittedAnswers] = useState<UserAnswer[] | null>(null);
    const [, setLocation] = useLocation();
    const [bookmarkedQuestions, setBookmarkedQuestions] = useState<BookmarkedQuestions>({});

    const { data: bookmarks, isLoading: isLoadingBookmarks } = useQuery<Bookmark[]>({
        queryKey: ["bookmarks"],
        queryFn: async () => {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Not authenticated");
            const response = await fetch(`/api/auth/bookmarks/`, {
                headers: { Authorization: `Token ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch bookmarks");
            return response.json();
        },
        enabled: isAuthenticated,
    });

    const { data: practiceTests, isLoading: isLoadingPracticeTests } = useQuery<PracticeTest[]>({
        queryKey: ["/api/practice-tests"],
        queryFn: async () => {
            const response = await fetch('/api/practice-tests/');
            if (!response.ok) throw new Error('Failed to fetch tests');
            return response.json();
        }
    });

    useEffect(() => {
        if (bookmarks && practiceTests) {
            // Filter only SSC tests
            const sscTests = practiceTests.filter(t => t.examType === "ssc");
            
            const groupedBookmarks: BookmarkedQuestions = bookmarks.reduce(
                (acc, bookmark) => {
                    const { subject, question_id } = bookmark;
                    
                    // Find the question in any SSC test
                    let foundQuestion: any = null;
                    for (const test of sscTests) {
                        const questions = test.questions as any[];
                        const q = questions.find(q => q.qid === question_id || (q as any).id === question_id);
                        if (q) {
                            foundQuestion = q;
                            break;
                        }
                    }

                    if (foundQuestion) {
                        const sub = subject || "General SSC";
                        if (!acc[sub]) {
                            acc[sub] = [];
                        }
                        if (!acc[sub].some(q => (q.qid || (q as any).id) === (foundQuestion.qid || foundQuestion.id))) {
                            acc[sub].push(foundQuestion);
                        }
                    }
                    return acc;
                },
                {} as BookmarkedQuestions
            );
            setBookmarkedQuestions(groupedBookmarks);
        }
    }, [bookmarks, practiceTests]);

    const handleExportPDF = async (subject: string) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Not authenticated");

            const response = await fetch('/api/auth/bookmarks/export-pdf/', {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subject }),
            });

            if (!response.ok) throw new Error("Failed to generate PDF");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${subject.replace(/\s+/g, '_')}_ssc_bookmarks.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Failed to export PDF:", error);
            alert("Failed to export PDF.");
        }
    };

    if (!isAuthenticated) return <Redirect to="/login" />;

    if (isLoadingBookmarks || isLoadingPracticeTests) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <AppHeader />
                <div className="flex-grow flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <AppFooter />
            </div>
        );
    }

    if (selectedSubject && bookmarkedQuestions[selectedSubject]) {
        const mockTest: PracticeTest = {
            id: "ssc-bookmarks-session",
            title: `${selectedSubject} Bookmarks`,
            examType: "ssc",
            subject: selectedSubject,
            duration: Math.max(30, bookmarkedQuestions[selectedSubject].length * 1.5),
            totalQuestions: bookmarkedQuestions[selectedSubject].length,
            questions: bookmarkedQuestions[selectedSubject],
        };

        if (submittedAnswers) {
            return (
                <LocalResultView
                    test={mockTest}
                    userAnswers={submittedAnswers}
                    onExit={() => {
                        setSelectedSubject(null);
                        setSubmittedAnswers(null);
                    }}
                    onRetake={() => {
                        setSubmittedAnswers(null);
                    }}
                />
            );
        }

        return (
            <div className="min-h-screen bg-background flex flex-col">
                <main className="flex-grow">
                    <MockTestInterface
                        test={mockTest}
                        onSubmit={async (answers: UserAnswer[]) => {
                            setSubmittedAnswers(answers);
                        }}
                    />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppHeader />

            <main className="container mx-auto px-4 py-8 flex-grow">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Link href="/ssc" className="hover:text-primary transition-colors">SSC</Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">Bookmarks</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-4">SSC Bookmarked Questions</h1>
                        <p className="text-xl text-muted-foreground">
                            Review your saved SSC practice questions.
                        </p>
                    </div>

                    {Object.keys(bookmarkedQuestions).length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(bookmarkedQuestions).map(([subject, questions]) => (
                                <Card
                                    key={subject}
                                    className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                >
                                    <CardHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <BookmarkIcon className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl">{subject}</CardTitle>
                                        <CardDescription>
                                            {questions.length} saved questions
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button
                                            className="w-full"
                                            onClick={() => setSelectedSubject(subject)}
                                        >
                                            Review Now
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => handleExportPDF(subject)}
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Export PDF
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-12 text-center border-dashed">
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-muted rounded-full">
                                    <BookmarkIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                No Bookmarks Yet
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Bookmark questions during tests to see them here.
                            </p>
                            <Link href="/ssc">
                                <Button>Go to SSC Tests</Button>
                            </Link>
                        </Card>
                    )}
                </div>
            </main>

            <AppFooter />
        </div>
    );
}
