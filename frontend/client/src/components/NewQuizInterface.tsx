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

/**
 * @interface QuizInterfaceProps
 * @property {PracticeTest} test - The test object containing questions and details.
 * @property {() => void} onExit - Function to be called when the user exits the quiz.
 * @property {(answers: UserAnswer[]) => void} onSubmit - Function to be called when the user submits the quiz.
 */
interface QuizInterfaceProps {
  test: PracticeTest;
  onExit: () => void;
  onSubmit: (answers: UserAnswer[]) => void;
}

/**
 * A comprehensive quiz interface for taking practice tests.
 *
 * This component provides a full-featured quiz experience, including a timer,
 * question palette for navigation, bookmarking functionality, and support for
 * both multiple-choice and text-input questions. It also handles displaying
 * passages and images associated with questions.
 *
 * @param {QuizInterfaceProps} props - The props for the component.
 * @returns {JSX.Element} The rendered quiz interface.
 */
export function NewQuizInterface({ test, onExit, onSubmit }: QuizInterfaceProps) {
  const [isPaletteVisible, setIsPaletteVisible] = useState(false);
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(new Set());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State for word definition pop-up
  const [selectedText, setSelectedText] = useState("");
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [definition, setDefinition] = useState("");
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);
  const [definitionError, setDefinitionError] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);

  const questions = test.questions as (Question & { image_url?: string })[];
  const currentQuestion = questions[currentQuestionIndex];
  const hasPassage = currentQuestion.passage_text && currentQuestion.passage_text !== "For the following questions answer them individually";

  const definitionMutation = useMutation({
    mutationFn: async ({ word, context }: { word: string; context: string }) => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/chatbot/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          message: `Define the word "${word}" in the context of: "${context}"`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch definition");
      }
      const data = await response.json();
      return data.reply;
    },
    onSuccess: (data) => {
      setDefinition(data);
      setDefinitionError("");
    },
    onError: () => {
      setDefinitionError("Could not fetch definition. Please try again.");
    },
    onSettled: () => {
      setIsLoadingDefinition(false);
    },
  });

  const saveWordMutation = useMutation({
    mutationFn: async ({
      word,
      meaning,
      context,
      question_id,
    }: {
      word: string;
      meaning: string;
      context: string;
      question_id: string;
    }) => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const response = await fetch("/api/auth/words/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ word, meaning, context, question_id }),
      });

      if (!response.ok) {
        throw new Error("Failed to save word");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Word Saved!",
        description: "The word has been added to your list.",
      });
      queryClient.invalidateQueries({ queryKey: ["words"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save word: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load bookmarks from the backend
  useEffect(() => {
    const fetchBookmarks = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`/api/auth/bookmarks/?subject=${test.subject}`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          });
          if (response.ok) {
            const bookmarks = await response.json();
            setBookmarkedQuestions(new Set(bookmarks.map((b: any) => b.question_id)));
          }
        } catch (error) {
          console.error("Failed to fetch bookmarks:", error);
        }
      }
    };
    fetchBookmarks();
  }, [test.subject]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    if (submittedAnswers.has(currentQuestion.qid)) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.qid]: answer }));
    if (currentQuestion.options.length > 0) {
      setSubmittedAnswers(prev => new Set(prev).add(currentQuestion.qid));
    }
  };

  const handleSubmitTextAnswer = () => {
    setSubmittedAnswers(prev => new Set(prev).add(currentQuestion.qid));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const deleteBookmarkMutation = useMutation({
    mutationFn: async (qid: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Not authenticated");
      const response = await fetch(`/api/auth/bookmarks/delete/${qid}/?subject=${test.subject}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete bookmark");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const createBookmarkMutation = useMutation({
    mutationFn: async (qid: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Not authenticated");
      const response = await fetch(`/api/auth/bookmarks/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ subject: test.subject, question_id: qid }),
      });
      if (!response.ok) {
        throw new Error("Failed to create bookmark");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const handleBookmarkToggle = async (qid: string) => {
    const newBookmarks = new Set(bookmarkedQuestions);
    if (newBookmarks.has(qid)) {
      deleteBookmarkMutation.mutate(qid, {
        onSuccess: () => {
          newBookmarks.delete(qid);
          setBookmarkedQuestions(newBookmarks);
          queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
        }
      });
    } else {
      createBookmarkMutation.mutate(qid, {
        onSuccess: () => {
          newBookmarks.add(qid);
          setBookmarkedQuestions(newBookmarks);
          queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
        }
      });
    }
  };

  const getOptionClassName = (option: any) => {
    if (!submittedAnswers.has(currentQuestion.qid)) return 'hover:bg-accent';

    const isCorrect = option.is_correct;
    const isSelected = answers[currentQuestion.qid] === option.data_option;

    if (isCorrect) return 'bg-green-200 border-green-500';
    if (isSelected && !isCorrect) return 'bg-red-200 border-red-500';
    return 'hover:bg-accent';
  };

  const getTextInputClassName = () => {
    if (!submittedAnswers.has(currentQuestion.qid)) return 'bg-input';

    const userAnswer = answers[currentQuestion.qid];
    const correctAnswer = currentQuestion.correct_option_data || currentQuestion.solution_text;

    return userAnswer === correctAnswer ? 'bg-green-200 border-green-500' : 'bg-red-200 border-red-500';
  };

  const handleClosePopup = () => {
    setIsPopupVisible(false);
    setSelectedText("");
    setDefinition("");
    setDefinitionError("");
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0 && text.length < 100) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (rect) {
        setSelectedText(text);
        setIsPopupVisible(true);
        setDefinitionError("");
      }
    } else {
      if (popupRef.current && !popupRef.current.contains(document.activeElement)) {
        handleClosePopup();
      }
    }
  };

  const handleGetDefinition = () => {
    setIsLoadingDefinition(true);
    definitionMutation.mutate({
      word: selectedText,
      context: currentQuestion.passage_text || currentQuestion.question_text,
    });
  };

  const handleSaveWord = () => {
    if (!definition) {
      toast({
        title: "No Definition",
        description: "Please get a definition before saving the word.",
        variant: "destructive",
      });
      return;
    }
    saveWordMutation.mutate({
      word: selectedText,
      meaning: definition,
      context: `From quiz: "${test.title}", Question ${currentQuestionIndex + 1}`,
      question_id: currentQuestion.qid,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        handleClosePopup();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <div className="flex flex-col h-screen bg-background" onMouseUp={handleTextSelection}>
      {isPopupVisible && (
        <div
          ref={popupRef}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
        >
          <Card className="w-80 shadow-lg">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{selectedText}</span>
                <Button variant="ghost" size="icon" onClick={handleClosePopup}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[50vh] overflow-y-auto">
              {isLoadingDefinition ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : definitionError ? (
                <p className="text-red-500">{definitionError}</p>
              ) : definition ? (
                <div className="prose max-w-none text-foreground dark:prose-invert">
                  <ReactMarkdown>{definition}</ReactMarkdown>
                </div>
              ) : null}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={handleGetDefinition}>
                  Get Definition
                </Button>
                <Button onClick={handleSaveWord} disabled={!definition || isLoadingDefinition}>
                  Save Word
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Test Header (Sticky) */}
      <div className="bg-muted/50 p-4 border-b border-border">
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground truncate">{test.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{test.subject} Section</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">

            <div className="text-center">
              <div className="text-sm sm:text-base font-bold text-foreground" data-testid="timer-display">
                {formatTime(timeElapsed)}
              </div>
              <div className="text-xs text-muted-foreground">Time</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-sm sm:text-base font-bold text-foreground" data-testid="question-counter">
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
              onClick={onExit}
            >
              Exit
            </Button>
          </div>
        </div>
      </div>

      {isCalculatorVisible && <Calculator onClose={() => setIsCalculatorVisible(false)} />}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Palette Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPaletteVisible(!isPaletteVisible)}
          className={`absolute top-1/2 -translate-y-1/2 z-10 rounded-full transition-all duration-300 ease-in-out hover:bg-card ${
            isPaletteVisible ? 'left-64 -ml-5' : 'left-1'
          }`}
        >
          {isPaletteVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
        </Button>
        {/* Question Navigation (Scrollable) */}
        {isPaletteVisible && (
          <div className="w-64 bg-muted/30 p-6 border-r border-border overflow-y-auto">
            <h4 className="font-semibold text-foreground mb-4">Question Palette</h4>
            <div className="grid grid-cols-5 gap-1 mb-6">
              {questions.map((question, index) => {
                const isAnswered = answers[question.qid] !== undefined;
                let isCorrect = false;
                if (isAnswered) {
                  if (question.options.length > 0) {
                    const correctOption = question.options.find(opt => opt.is_correct);
                    isCorrect = !!correctOption && answers[question.qid] === correctOption.data_option;
                  } else {
                    const correctAnswer = question.correct_option_data || question.solution_text;
                    isCorrect = answers[question.qid] === correctAnswer;
                  }
                }
                const isBookmarked = bookmarkedQuestions.has(question.qid);
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded text-xs font-semibold transition-colors hover-elevate relative ${
                      index === currentQuestionIndex
                        ? 'bg-primary text-primary-foreground'
                        : isAnswered
                        ? isCorrect
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                        : 'bg-card border border-border text-foreground hover:bg-accent'
                    }`}
                    data-testid={`question-nav-${index + 1}`}
                  >
                    {isBookmarked && <Bookmark className="absolute top-0 right-0 h-3 w-3 text-yellow-400" />}
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Content (Scrollable) */}
        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground" data-testid="question-info">
                Question {currentQuestionIndex + 1} of {test.totalQuestions}
              </span>
              <Button variant="ghost" size="icon" onClick={() => handleBookmarkToggle(currentQuestion.qid)}>
                <Bookmark className={`h-5 w-5 ${bookmarkedQuestions.has(currentQuestion.qid) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              {currentQuestion.options.length > 0 ? "Multiple Choice Question" : "Text Input Question"}
            </span>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {(hasPassage || currentQuestion.image_url) && (
              <div className="w-[65%] pr-4 overflow-y-auto">
                <div className="bg-muted/50 p-4 rounded-lg h-full">
                  <h5 className="font-semibold text-foreground mb-2">Passage:</h5>
                  {hasPassage && (
                    <div className="prose max-w-none text-foreground leading-relaxed preserve-whitespace">
                      <Latex>{currentQuestion.passage_text}</Latex>
                    </div>
                  )}
                  {currentQuestion.image_url && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {currentQuestion.image_url.split(',').map((url, i) => (
                        <img key={i} src={url.trim()} alt={`Passage image ${i + 1}`} className="max-w-full h-auto rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`${(hasPassage || currentQuestion.image_url) ? 'w-[35%] pl-4' : 'w-full'} overflow-y-auto`}>
              <div className="prose max-w-none mb-6">
                <p className="text-foreground leading-relaxed mb-4 preserve-whitespace" data-testid="question-text">
                  <Latex>{currentQuestion.question_text}</Latex>
                </p>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.length > 0 ? (
                  currentQuestion.options.map((option) => (
                    <label 
                      key={option.data_option}
                      className={`flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer transition-colors ${getOptionClassName(option)}`}
                      onClick={() => handleAnswerSelect(option.data_option)}
                    >
                      <div className="w-5 h-5 border-2 border-border rounded-full flex items-center justify-center">
                        <div className={`w-2.5 h-2.5 bg-primary rounded-full ${answers[currentQuestion.qid] === option.data_option ? 'opacity-100' : 'opacity-0'}`}></div>
                      </div>
                      <span className="font-medium text-foreground">{option.label}.</span>
                      <span className="text-foreground preserve-whitespace">
                        <Latex>{option.option_text}</Latex>
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      id="answer-input"
                      value={answers[currentQuestion.qid] || ''}
                      onChange={(e) => handleAnswerSelect(e.target.value)}
                      className={`block w-full p-2 border border-border rounded-lg text-foreground ${getTextInputClassName()}`}
                      data-testid="answer-input"
                      disabled={submittedAnswers.has(currentQuestion.qid)}
                    />
                    <Button 
                      onClick={handleSubmitTextAnswer}
                      disabled={submittedAnswers.has(currentQuestion.qid)}
                    >
                      Submit
                    </Button>
                  </div>
                )}
              </div>
              {submittedAnswers.has(currentQuestion.qid) && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-foreground mb-2">Solution</h4>
                  <div className="prose max-w-none text-foreground leading-relaxed preserve-whitespace">
                    <Latex>
                      {currentQuestion.options.length === 0
                        ? `${currentQuestion.correct_option_data || ''}${currentQuestion.solution_text ? `${currentQuestion.solution_text}` : ''}` || "No solution provided."
                        : currentQuestion.solution_text || "No solution provided."}
                    </Latex>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-border">
            <Button 
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous Question
            </Button>
            <Button 
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next Question
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}