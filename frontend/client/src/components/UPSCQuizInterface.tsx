import { Chatbot, type Message } from "./chatbot";
import { MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import Latex from "react-latex-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PracticeTest, Question, UserAnswer } from "@shared/schema";
import { PanelLeftClose, PanelRightClose, Bookmark, Calculator as CalculatorIcon, X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Calculator } from "./ui/calculator";

interface UPSCQuizInterfaceProps {
    test: PracticeTest;
    onExit: () => void;
    onSubmit: (answers: UserAnswer[]) => void;
    onProgressUpdate: (answers: UserAnswer[], currentIndex: number) => void;
    navigateToQuestion: (index: number) => void;
    currentQuestionIndex: number;
    duration?: number;
    initialAnswers?: UserAnswer[];
    initialTimeElapsed?: number;
}

export function UPSCQuizInterface({
    test,
    onExit,
    onSubmit,
    onProgressUpdate,
    navigateToQuestion,
    currentQuestionIndex,
    duration,
    initialAnswers = [],
    initialTimeElapsed = 0
}: UPSCQuizInterfaceProps) {
    const [isPaletteVisible, setIsPaletteVisible] = useState(false);
    const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [answers, setAnswers] = useState<{ [key: string]: string }>(() => {
        const initialMap: { [key: string]: string } = {};
        initialAnswers.forEach(ans => {
            if (ans.selectedAnswer) initialMap[ans.questionId] = ans.selectedAnswer;
        });
        return initialMap;
    });
    const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(() => {
        const submitted = new Set<string>();
        initialAnswers.forEach(ans => {
            if (ans.selectedAnswer) submitted.add(ans.questionId);
        });
        return submitted;
    });
    const [timeElapsed, setTimeElapsed] = useState(initialTimeElapsed);
    const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch bookmarks on load
    useEffect(() => {
        const fetchBookmarks = async () => {
            if (!test.subject) return;
            try {
                const res = await fetch(`/api/auth/bookmarks/?subject=${test.subject}`, {
                    headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const bookmarkedIds = new Set<string>(data.map((b: any) => String(b.question_id)));
                    setBookmarkedQuestions(bookmarkedIds);
                }
            } catch (err) {
                console.error("Failed to fetch bookmarks", err);
            }
        };
        fetchBookmarks();
    }, [test.subject]);

    const [chatHistories, setChatHistories] = useState<{ [qid: string]: Message[] }>({});

    const questions = test.questions as (Question & { image_url?: string })[] | undefined;

    if (!questions || questions.length === 0) {
        return (
            <div className="flex flex-col h-screen bg-background">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">No questions found.</h2>
                        <Button onClick={onExit}>Go Back</Button>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const hasPassage = currentQuestion?.passage_text && currentQuestion.passage_text !== "For the following questions answer them individually";

    useEffect(() => {
        if (onProgressUpdate) {
            const userAnswers: UserAnswer[] = questions
                .filter(q => q)
                .map(question => ({
                    questionId: question?.qid,
                    selectedAnswer: answers[question?.qid] || null,
                    timeSpent: 0,
                    isMarkedForReview: bookmarkedQuestions.has(question?.qid),
                }));
            onProgressUpdate(userAnswers, currentQuestionIndex);
        }
    }, [answers, onProgressUpdate, questions, bookmarkedQuestions, currentQuestionIndex]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getDisplayTime = () => {
        if (duration) {
            const remaining = Math.max(0, duration - timeElapsed);
            return formatTime(remaining);
        }
        return formatTime(timeElapsed);
    };

    useEffect(() => {
        if (duration && timeElapsed >= duration) {
            handleSubmit();
        }
    }, [duration, timeElapsed]);

    const handleAnswerSelect = (answer: string) => {
        if (submittedAnswers.has(currentQuestion?.qid)) return;
        setAnswers(prev => ({ ...prev, [currentQuestion.qid]: answer }));
        setSubmittedAnswers(prev => new Set(prev).add(currentQuestion.qid));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            navigateToQuestion(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            navigateToQuestion(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = () => {
        const userAnswers: UserAnswer[] = questions.map(question => ({
            questionId: question.qid,
            selectedAnswer: answers[question.qid] || null,
            timeSpent: 0,
            isMarkedForReview: bookmarkedQuestions.has(question.qid),
        }));
        onSubmit(userAnswers);
    };

    const handleBookmarkToggle = async (qid: string) => {
        const isBookmarked = bookmarkedQuestions.has(qid);

        // Optimistic update
        setBookmarkedQuestions(prev => {
            const next = new Set(prev);
            if (isBookmarked) next.delete(qid);
            else next.add(qid);
            return next;
        });

        try {
            if (isBookmarked) {
                // Delete bookmark
                await fetch(`/api/auth/bookmarks/delete/${qid}/?subject=${test.subject}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
                });
            } else {
                // Create bookmark
                await fetch('/api/auth/bookmarks/create/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        subject: test.subject,
                        question_id: qid
                    })
                });
            }
        } catch (error) {
            console.error("Failed to toggle bookmark", error);
            // Revert state on error? For now, we'll just log it. 
            toast({
                title: "Error",
                description: "Failed to update bookmark.",
                variant: "destructive",
            });
        }
    };

    const getOptionClassName = (option: any) => {
        const isSelected = answers[currentQuestion?.qid] === option.data_option;
        if (isSelected) return 'bg-primary/20 border-primary';
        return 'hover:bg-accent';
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <div className="bg-muted/50 p-4 border-b border-border">
                <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground truncate">{test.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">UPSC Section - {test.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="text-center">
                            <div className="text-sm sm:text-base font-bold text-foreground">
                                {getDisplayTime()}
                            </div>
                            <div className="text-xs text-muted-foreground">{duration ? 'Remaining' : 'Time'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm sm:text-base font-bold text-foreground">
                                {submittedAnswers.size}
                            </div>
                            <div className="text-xs text-muted-foreground">Attempted</div>
                        </div>
                        <div className="text-center hidden sm:block">
                            <div className="text-sm sm:text-base font-bold text-foreground">
                                {currentQuestionIndex + 1}/{test.totalQuestions}
                            </div>
                            <div className="text-xs text-muted-foreground">Question</div>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => setIsCalculatorVisible(!isCalculatorVisible)}>
                            <CalculatorIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleSubmit}
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </div>

            {isCalculatorVisible && <Calculator onClose={() => setIsCalculatorVisible(false)} />}

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden relative">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsPaletteVisible(!isPaletteVisible)}
                    className={`absolute top-1/2 -translate-y-1/2 z-10 rounded-full transition-all duration-300 ease-in-out hover:bg-card ${isPaletteVisible ? 'left-64 -ml-5' : 'left-1'}`}
                >
                    {isPaletteVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
                </Button>

                {isPaletteVisible && (
                    <div className="w-64 bg-muted/30 p-6 border-r border-border overflow-y-auto">
                        <h4 className="font-semibold text-foreground mb-4">Question Palette</h4>
                        <div className="grid grid-cols-5 gap-1 mb-6">
                            {questions.map((question, index) => {
                                const isAnswered = answers[question?.qid] !== undefined;
                                const isBookmarked = bookmarkedQuestions.has(question?.qid);
                                return (
                                    <button
                                        key={index}
                                        onClick={() => navigateToQuestion(index)}
                                        className={`w-8 h-8 rounded text-xs font-semibold transition-colors relative ${index === currentQuestionIndex
                                            ? 'bg-primary text-primary-foreground'
                                            : isAnswered
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-card border border-border text-foreground hover:bg-accent'
                                            }`}
                                    >
                                        {isBookmarked && <Bookmark className="absolute top-0 right-0 h-3 w-3 text-yellow-400" />}
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col p-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">
                                Question {currentQuestionIndex + 1} of {test.totalQuestions}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => handleBookmarkToggle(currentQuestion?.qid)}>
                                <Bookmark className={`h-5 w-5 ${bookmarkedQuestions.has(currentQuestion?.qid) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsChatbotOpen(true)}>
                                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                        <Badge variant="outline">UPSC Prelims Style</Badge>
                    </div>

                    {isChatbotOpen && (() => {
                        const currentQuestionId = currentQuestion?.qid;
                        const currentChatHistory = chatHistories[currentQuestionId] || [];
                        const initialMessage = `Help me understand this UPSC question:\n\n**Question:**\n${currentQuestion?.question_text}\n\n**Options:**\n${currentQuestion?.options.map((o) => `- ${o.label}: ${o.option_text}`).join('\n')}`;

                        return (
                            <Chatbot
                                onClose={() => setIsChatbotOpen(false)}
                                initialMessage={currentChatHistory.length === 0 ? initialMessage : undefined}
                                history={currentChatHistory}
                                onHistoryChange={(newHistory) => {
                                    setChatHistories(prev => ({ ...prev, [currentQuestionId]: newHistory }));
                                }}
                                onBookmarkChange={() => handleBookmarkToggle(currentQuestionId)}
                            />
                        );
                    })()}

                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <div className="max-w-5xl mx-auto w-full">
                            <div className="prose max-w-none mb-8 dark:prose-invert">
                                <div className="text-lg text-foreground leading-relaxed mb-4 preserve-whitespace">
                                    <Latex>{currentQuestion?.question_text || ""}</Latex>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                {currentQuestion?.options.map((option) => (
                                    <label
                                        key={option.data_option}
                                        className={`flex items-center gap-4 p-5 border border-border rounded-xl cursor-pointer transition-all hover:bg-muted/50 ${getOptionClassName(option)}`}
                                        onClick={() => handleAnswerSelect(option.data_option)}
                                    >
                                        <div className="w-6 h-6 border-2 border-border rounded-full flex items-center justify-center shrink-0">
                                            <div className={`w-3 h-3 bg-primary rounded-full transition-opacity ${answers[currentQuestion?.qid] === option.data_option ? 'opacity-100' : 'opacity-0'}`}></div>
                                        </div>
                                        <div className="flex gap-3 w-full">
                                            <span className="font-semibold text-foreground/80">{option.label}.</span>
                                            <span className="text-foreground text-lg leading-relaxed">
                                                <Latex>{option.option_text || ""}</Latex>
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border mt-auto">
                        <div className="max-w-5xl mx-auto w-full flex justify-between">
                            <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0} variant="outline" size="lg">
                                Previous
                            </Button>
                            <div className="flex gap-3">
                                {currentQuestionIndex === questions.length - 1 ? (
                                    <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700" size="lg">
                                        Submit Test
                                    </Button>
                                ) : (
                                    <Button onClick={handleNext} size="lg">
                                        Next Question
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
