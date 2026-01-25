import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { UPSCQuizInterface } from "@/components/UPSCQuizInterface";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PracticeTest, Question, Bookmark } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Redirect, Link } from "wouter";
import { Loader2, Download, Bookmark as BookmarkIcon } from "lucide-react";

interface BookmarkedQuestions {
    [subject: string]: Question[];
}

export default function UPSCBookmarksPage() {
    const { isAuthenticated } = useAuth();
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isExporting, setIsExporting] = useState<string | null>(null);

    const { data: bookmarks, isLoading: isLoadingBookmarks } = useQuery<Bookmark[]>({
        queryKey: ["bookmarks"],
        queryFn: async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Not authenticated");
            }
            const response = await fetch(`/api/auth/bookmarks/`, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch bookmarks");
            }
            return response.json();
        },
        enabled: isAuthenticated,
    });

    const { data: practiceTests, isLoading: isLoadingPracticeTests } = useQuery<PracticeTest[]>({
        queryKey: ["/api/practice-tests"],
    });

    const [bookmarkedQuestions, setBookmarkedQuestions] =
        useState<BookmarkedQuestions>({});

    useEffect(() => {
        if (bookmarks && practiceTests) {
            const groupedBookmarks: BookmarkedQuestions = bookmarks.reduce(
                (acc, bookmark) => {
                    const { subject, question_id } = bookmark;
                    // Filter for UPSC subjects if needed, or just show all. 
                    // Ideally we filter by examType 'upsc', but bookmarks don't store examType directly.
                    // We can infer from the test it came from.

                    const test = practiceTests.find(p => p.subject === subject);
                    if (test) {
                        const question = (test.questions as Question[]).find(q => q.qid === question_id);
                        if (question) {
                            if (!acc[subject]) {
                                acc[subject] = [];
                            }
                            acc[subject].push(question);
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
        setIsExporting(subject);
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate PDF");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${subject.replace(/\s+/g, '_')}_bookmarks.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Failed to export PDF:", error);
            alert("Failed to export PDF. Please ensure the backend has LaTeX installed.");
        } finally {
            setIsExporting(null);
        }
    };

    if (!isAuthenticated) {
        return <Redirect to="/login" />;
    }

    if (isLoadingBookmarks || isLoadingPracticeTests) {
        return (
            <div className="min-h-screen bg-background">
                <AppHeader />
                <div className="flex items-center justify-center min-h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
                <AppFooter />
            </div>
        );
    }

    if (selectedSubject && bookmarkedQuestions[selectedSubject]) {
        const test: PracticeTest = {
            id: "bookmarks-session",
            title: `${selectedSubject} Bookmarks`,
            examType: "upsc", // Force UPSC type for layout
            subject: selectedSubject,
            duration: 0,
            totalQuestions: bookmarkedQuestions[selectedSubject].length,
            questions: bookmarkedQuestions[selectedSubject],
        };

        const navigateToQuestion = (index: number) => {
            if (index >= 0 && index < bookmarkedQuestions[selectedSubject].length) {
                setCurrentQuestionIndex(index);
            }
        };

        return (
            <UPSCQuizInterface
                test={test}
                onExit={() => {
                    setSelectedSubject(null);
                    setCurrentQuestionIndex(0);
                }}
                onSubmit={() => { }}
                onProgressUpdate={() => { }}
                navigateToQuestion={navigateToQuestion}
                currentQuestionIndex={currentQuestionIndex}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Link href="/upsc" className="hover:text-primary transition-colors">UPSC</Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">Bookmarks</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Bookmarked Questions</h1>
                        <p className="text-xl text-muted-foreground">
                            Review and practice questions you saved for later.
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
                                            Start Review
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => handleExportPDF(subject)}
                                            disabled={isExporting === subject}
                                        >
                                            {isExporting === subject ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Generating PDF...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Export PDF
                                                </>
                                            )}
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
                                No Bookmarked Questions
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Bookmark questions during quizzes to see them here.
                            </p>
                            <Link href="/upsc">
                                <Button>Go to Quizzes</Button>
                            </Link>
                        </Card>
                    )}
                </div>
            </main>

            <AppFooter />
        </div>
    );
}
