
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { NewQuizInterface } from "@/components/NewQuizInterface";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { PracticeTest, Question, Bookmark } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "wouter";
import { Loader2, Download } from "lucide-react";

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

    const { data: practiceTests } = useQuery<PracticeTest[]>({
        queryKey: ["/api/practice-tests"],
    });

    const [bookmarkedQuestions, setBookmarkedQuestions] = useState<BookmarkedQuestions>({});

    useEffect(() => {
        if (bookmarks) {
            const groupedBookmarks: BookmarkedQuestions = bookmarks.reduce(
                (acc, bookmark) => {
                    const { subject, question_id } = bookmark;

                    // Only process UPSC Chapterwise bookmarks (cw-...)
                    if (question_id.startsWith('cw-')) {
                        let data = (bookmark as any).question_data;

                        // Fallback: Try to find in practiceTests if not enriched
                        if (!data && practiceTests) {
                            for (const test of practiceTests) {
                                if (test.questions) {
                                    const found = (test.questions as Question[]).find(q => q.qid === question_id || (q as any).id === question_id);
                                    if (found) {
                                        data = {
                                            question: found.question_text,
                                            options: found.options,
                                            correctAnswer: found.correct_option_data,
                                            // Handle various explanation fields
                                            explanation: (found as any).answer_description || found.solution_text || found.explanation || (found as any).rationale
                                        };
                                        break;
                                    }
                                }
                            }
                        }

                        if (data) {
                            const question = {
                                qid: question_id,
                                question_text: data.question || data.question_text,
                                options: data.options,
                                correct_option_data: data.correctAnswer || data.correct_answer,
                                solution_text: data.explanation,
                                explanation: data.explanation,
                                id: question_id,
                                subject: subject,
                                images: [],
                                type: "mcq"
                            } as unknown as Question;

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
            a.download = `${subject.replace(/\s+/g, '_')}_upsc_bookmarks.pdf`;
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

    if (isLoadingBookmarks) {
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
        const questions = bookmarkedQuestions[selectedSubject];

        // Mapper for NewQuizInterface
        const mappedQuestions = questions.map(q => {
            let mappedOptions = q.options;
            if (Array.isArray(q.options) && q.options.length > 0) {
                // If missing data_option, assume it's storage format or raw quiz.json format
                if ((q.options[0] as any).data_option === undefined) {
                    mappedOptions = q.options.map((opt: any, idx: number) => ({
                        data_option: opt.label || String.fromCharCode(65 + idx),
                        label: opt.label || String.fromCharCode(65 + idx),
                        option_text: opt.text,
                        is_correct: (opt.isCorrect !== undefined) ? opt.isCorrect : (opt.label === (q as any).correctAnswer)
                    }));
                }
            }

            return {
                ...q,
                // Ensure compatibility
                qid: (q as any).qid || (q as any).id,
                question_text: (q as any).question || q.question_text,
                passage_text: (q as any).passage_text || "",
                options: mappedOptions,
                solution_text: (q as any).explanation || (q as any).solution_text || (q as any).rationale,
                correct_option_data: (q as any).correctAnswer
            };
        });

        const test: PracticeTest = {
            id: selectedSubject,
            title: `${selectedSubject} Bookmarks`,
            examType: "upsc-chapterwise",
            subject: selectedSubject,
            duration: 0,
            totalQuestions: mappedQuestions.length,
            questions: mappedQuestions,
        };

        const navigateToQuestion = (index: number) => {
            if (index >= 0 && index < mappedQuestions.length) {
                setCurrentQuestionIndex(index);
            }
        };

        return (
            <NewQuizInterface
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
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
                            UPSC Bookmarks
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                            Review your bookmarked UPSC questions by subject.
                        </p>
                    </div>

                    {Object.keys(bookmarkedQuestions).length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(bookmarkedQuestions).map(([subject, questions]) => (
                                <Card
                                    key={subject}
                                    className="hover:shadow-lg transition-all duration-300 hover-elevate border-t-4 border-t-purple-500"
                                >
                                    <CardHeader>
                                        <CardTitle className="text-xl">{subject}</CardTitle>
                                        <CardDescription>
                                            {questions.length} questions
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button
                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                        <div className="text-center py-12">
                            <div className="max-w-md mx-auto">
                                <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">
                                    bookmark
                                </span>
                                <h3 className="text-xl font-semibold mb-2">
                                    No UPSC Bookmarks
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    You haven't bookmarked any UPSC questions yet.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <AppFooter />
        </div>
    );
}
