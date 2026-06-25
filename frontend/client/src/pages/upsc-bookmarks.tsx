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
import { LocalResultView } from "@/components/local-result-view";
import type { PracticeTest, Question, Bookmark, UserAnswer } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Redirect, Link } from "wouter";
import { Loader2, Download, Bookmark as BookmarkIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface BookmarkedQuestions {
    [subject: string]: Question[];
}

// Define interfaces for Chapterwise Quiz Data
interface QuizOption {
    text: string;
    isCorrect: boolean;
    rationale: string;
}

interface QuizQuestion {
    question: string;
    answerOptions: QuizOption[];
    hint: string;
    id?: string;
    qid?: string;
}

interface QuizData {
    title: string;
    questions: QuizQuestion[];
    subject?: string;
}

export default function UPSCBookmarksPage() {
    const { isAuthenticated } = useAuth();
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [includeAnswersInPdf, setIncludeAnswersInPdf] = useState(false);

    // State to store answers upon submission
    const [submittedAnswers, setSubmittedAnswers] = useState<UserAnswer[] | null>(null);

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

    // Fetch UPSC Chapterwise Quizzes
    const { data: chapterwiseQuizzes, isLoading: isLoadingChapterwise } = useQuery<QuizData[]>({
        queryKey: ["/api/chapterwise-quiz/"],
        queryFn: async () => {
            const response = await fetch('/api/chapterwise-quiz/');
            if (!response.ok) throw new Error('Failed to fetch quizzes');
            return response.json();
        }
    });

    // --- Independent code for new sections ---
    const { data: monthlyMcqs, isLoading: isLoadingMonthly } = useQuery<QuizData[]>({
        queryKey: ["/data/monthly_mcq_questions.json"],
        queryFn: async () => {
            const response = await fetch('/data/monthly_mcq_questions.json');
            if (!response.ok) throw new Error('Failed to fetch quizzes');
            return response.json();
        }
    });

    const { data: upsc2027Tests, isLoading: isLoading2027Tests } = useQuery<PracticeTest[]>({
        queryKey: ["/api/upsc/2027-tests/?include_questions=true"],
        queryFn: async () => {
            const token = localStorage.getItem("token");
            const response = await fetch('/api/upsc/2027-tests/?include_questions=true', {
                headers: { Authorization: `Token ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch 2027 tests');
            return response.json();
        },
        enabled: isAuthenticated,
    });

    const { data: dpqQuizzes, isLoading: isLoadingDpq } = useQuery<QuizData[]>({
        queryKey: ["/data/dpq_questions.json"],
        queryFn: async () => {
            const response = await fetch('/data/dpq_questions.json');
            if (!response.ok) throw new Error('Failed to fetch quizzes');
            return response.json();
        }
    });

    const { data: ncertQuizzes, isLoading: isLoadingNcert } = useQuery<QuizData[]>({
        queryKey: ["/api/ncert-quiz/"],
        queryFn: async () => {
            const response = await fetch('/api/ncert-quiz/');
            if (!response.ok) throw new Error('Failed to fetch quizzes');
            return response.json();
        }
    });
    // ----------------------------------------

    const [bookmarkedQuestions, setBookmarkedQuestions] =
        useState<BookmarkedQuestions>({});

    // Helper to convert chapterwise data to PracticeTest format
    const convertToPracticeTest = (data: QuizData, index: number): PracticeTest => {
        // Generating stable ID based on title
        const safeTitle = data.title ? data.title.replace(/[^a-zA-Z0-9]/g, '') : `Quiz${index}`;
        const testId = `cw_${index}_${safeTitle}`;

        const questions: any[] = data.questions.map((q: any, idx) => {
            const correctOptionIndex = q.answerOptions.findIndex((o: any) => o.isCorrect);
            const options = q.answerOptions.map((opt: any, i: number) => ({
                label: String.fromCharCode(97 + i),
                option_text: opt.text || "Option text missing",
                data_option: String.fromCharCode(97 + i),
                explanation: opt.rationale,
                is_correct: opt.isCorrect
            }));

            const persistentId = q.qid || q.id;
            const finalId = persistentId || `${testId}_q${idx}`;

            return {
                id: finalId,
                qid: finalId,
                index: idx,
                question_text: q.question || "Question text missing",
                options: options,
                correct_answer: String.fromCharCode(97 + correctOptionIndex),
                explanation: q.answerOptions[correctOptionIndex]?.rationale || "",
                status: 'active',
                created_at: new Date().toISOString()
            };
        });

        // Heuristic to clean subject if it comes in mixed case
        let subject = data.subject || "General Studies";
        // Capitalize first letter of each word
        subject = subject.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

        return {
            id: testId,
            title: data.title || `Chapter ${index + 1}`,
            examType: "upsc",
            subject: subject,
            duration: Math.ceil(questions.length * 1.5),
            totalQuestions: questions.length,
            questions: questions,
            is_full_length: false,
            created_at: new Date().toISOString()
        } as PracticeTest;
    };


    useEffect(() => {
        if (bookmarks) {
            let allTests: PracticeTest[] = [];

            // Prioritize Chapterwise Quizzes for UPSC bookmarks
            if (chapterwiseQuizzes) {
                const convertedTests = chapterwiseQuizzes.map((quiz, index) => convertToPracticeTest(quiz, index));
                allTests = [...allTests, ...convertedTests];
            }

            if (practiceTests) {
                allTests = [...allTests, ...practiceTests];
            }

            // --- Independent code for Monthly, DPQ, NCERT ---
            if (monthlyMcqs) {
                const convertedTests = monthlyMcqs.map((quiz, index) => convertToPracticeTest(quiz, index));
                allTests = [...allTests, ...convertedTests];
            }

            if (dpqQuizzes) {
                const convertedTests = dpqQuizzes.map((quiz, index) => convertToPracticeTest(quiz, index));
                allTests = [...allTests, ...convertedTests];
            }

            if (ncertQuizzes) {
                const convertedTests = ncertQuizzes.map((quiz, index) => convertToPracticeTest(quiz, index));
                allTests = [...allTests, ...convertedTests];
            }
            // ------------------------------------------------

            if (upsc2027Tests) {
                allTests = [...allTests, ...upsc2027Tests];
            }

            const groupedBookmarks: BookmarkedQuestions = bookmarks.reduce(
                (acc, bookmark) => {
                    const { subject, question_id } = bookmark;

                    const test = allTests.find(p => p.subject === subject || (p.questions as any[]).some(q => q.qid === question_id || q.id === question_id));

                    if (test) {
                        const question = (test.questions as any[]).find(q => q.qid === question_id || q.id === question_id);
                        if (question) {
                            if (!acc[subject]) {
                                acc[subject] = [];
                            }
                            // Avoid duplicates
                            if (!acc[subject].some(q => q.qid === question.qid)) {
                                acc[subject].push(question);
                            }
                        }
                    }
                    return acc;
                },
                {} as BookmarkedQuestions
            );
            setBookmarkedQuestions(groupedBookmarks);
        }
    }, [bookmarks, practiceTests, chapterwiseQuizzes, monthlyMcqs, dpqQuizzes, ncertQuizzes, upsc2027Tests]);

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
                body: JSON.stringify({ subject, include_answers: includeAnswersInPdf }),
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

    if (isLoadingBookmarks || (isLoadingPracticeTests && isLoadingChapterwise && isLoadingMonthly && isLoadingDpq && isLoadingNcert)) {
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

        if (submittedAnswers) {
            return (
                <LocalResultView
                    test={test}
                    userAnswers={submittedAnswers}
                    onExit={() => {
                        setSelectedSubject(null);
                        setSubmittedAnswers(null);
                        setCurrentQuestionIndex(0);
                    }}
                    onRetake={() => {
                        setSubmittedAnswers(null);
                        setCurrentQuestionIndex(0);
                    }}
                />
            );
        }

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
                onSubmit={(answers) => {
                    setSubmittedAnswers(answers);
                }}
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

                    <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border w-fit">
                        <Checkbox 
                            id="include-answers" 
                            checked={includeAnswersInPdf} 
                            onCheckedChange={(checked) => setIncludeAnswersInPdf(checked as boolean)} 
                        />
                        <Label htmlFor="include-answers" className="cursor-pointer font-medium text-sm">
                            Include answers below questions in exported PDFs
                        </Label>
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
