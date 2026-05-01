import { useState, useEffect } from "react";
import Latex from "react-latex-next";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PracticeTest, Question } from "@shared/schema";
import { PanelLeftClose, PanelRightClose, Bookmark } from "lucide-react";

interface ResultQuestionStatus {
  isCorrect: boolean | null;
  isCurrent: boolean;
}

interface TestResultInterfaceProps {
  test: PracticeTest;
  userAnswers: Record<string, string>;
  score: number;
  accuracy: number;
  timeTaken: string;
  attemptedQuestions: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  onReturnToDashboard?: () => void;
  customActions?: React.ReactNode;
}

export default function TestResultInterface({
  test,
  userAnswers,
  score,
  accuracy,
  timeTaken,
  attemptedQuestions,
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  onReturnToDashboard,
  customActions
}: TestResultInterfaceProps) {
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());

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

  const handleBookmarkToggle = async (qid: string) => {
      if (!qid) return;
      const isBookmarked = bookmarkedQuestions.has(qid);
      
      setBookmarkedQuestions(prev => {
          const next = new Set(prev);
          if (isBookmarked) next.delete(qid);
          else next.add(qid);
          return next;
      });

      try {
          if (isBookmarked) {
              await fetch(`/api/auth/bookmarks/delete/${qid}/?subject=${test.subject}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
              });
          } else {
              await fetch('/api/auth/bookmarks/create/', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Token ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify({ subject: test.subject, question_id: qid })
              });
          }
      } catch (error) {
          console.error("Failed to toggle bookmark", error);
      }
  };

  const questions = test.questions as (Question & { image_url?: string })[];
  const currentQuestion = questions[currentQuestionIndex];
  const hasPassage = currentQuestion?.passage_text && currentQuestion.passage_text !== "For the following questions answer them individually";

  const getQuestionStatus = (questionIndex: number): ResultQuestionStatus => {
    const question = questions[questionIndex];
    const userAnswer = userAnswers[question?.qid];
    let isCorrect: boolean | null = null;

    if (userAnswer != null) {
      if (question.options.length > 0) {
        const correctOption = question.options.find(o => o.is_correct);
        isCorrect = correctOption?.data_option === userAnswer;
      } else {
        isCorrect = userAnswer === question.correct_option_data;
      }
    }

    return {
      isCorrect,
      isCurrent: questionIndex === currentQuestionIndex,
    };
  };

  const navigateToQuestion = (questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestionIndex(questionIndex);
    }
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

  const getUserAnswerForCurrentQuestion = () => {
    return userAnswers[currentQuestion?.qid];
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="bg-muted/50 p-4 border-b border-border flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-foreground truncate">{test.title} - Results</h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{test.subject} Section</p>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-lg font-bold">{score}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="text-lg font-bold">{accuracy.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Time Taken</p>
            <p className="text-lg font-bold">{timeTaken}</p>
          </div>
        </div>
        <div className="w-1/4">
          <Progress value={(attemptedQuestions / totalQuestions) * 100} />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>
              Attempted: {attemptedQuestions}/{totalQuestions}
            </span>
            <span>
              Correct: {correctAnswers} | Incorrect: {incorrectAnswers}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPaletteVisible(!isPaletteVisible)}
          className={`absolute top-1/2 -translate-y-1/2 z-10 rounded-full transition-all duration-300 ease-in-out hover:bg-card ${isPaletteVisible ? 'left-64 -ml-5' : 'left-1'
            }`}
        >
          {isPaletteVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
        </Button>
        {isPaletteVisible && (
          <div className="w-64 bg-muted/30 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
            <h4 className="font-semibold text-foreground mb-4">Question Palette</h4>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-5 gap-2 mb-6">
              {questions.map((question, index) => {
                const status = getQuestionStatus(index);
                const isBookmarked = bookmarkedQuestions.has(question?.qid);
                let bgClass = 'bg-gray-400 text-white'; // Not Answered
                if (status.isCurrent) {
                  bgClass = 'bg-primary text-primary-foreground';
                } else if (status.isCorrect === true) {
                  bgClass = 'bg-green-500 text-white';
                } else if (status.isCorrect === false) {
                  bgClass = 'bg-red-500 text-white';
                }

                return (
                  <button
                    key={index}
                    onClick={() => navigateToQuestion(index)}
                    className={`relative w-8 h-8 rounded text-xs font-semibold transition-colors hover-elevate ${bgClass}`}
                  >
                    {isBookmarked && <Bookmark className="absolute top-0 right-0 h-3 w-3 text-yellow-400" />}
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-primary rounded"></div><span>Current</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span>Correct</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded"></div><span>Incorrect</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-400 rounded"></div><span>Not Answered</span></div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Question {currentQuestionIndex + 1} of {test.totalQuestions}
              </span>
              <Button variant="ghost" size="icon" onClick={() => handleBookmarkToggle(currentQuestion?.qid)}>
                <Bookmark className={`h-5 w-5 ${bookmarkedQuestions.has(currentQuestion?.qid) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex flex-col xl:flex-row overflow-hidden gap-4">
            {(hasPassage || currentQuestion?.image_url) && (
              <div className="w-full xl:w-[60%] pr-4 overflow-y-auto">
                <div className="bg-muted/50 p-4 rounded-lg h-full">
                  <h5 className="font-semibold text-foreground mb-2">Passage:</h5>
                  {hasPassage && <div className="prose max-w-none text-foreground leading-relaxed preserve-whitespace"><Latex>{currentQuestion?.passage_text}</Latex></div>}
                  {currentQuestion?.image_url && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {currentQuestion?.image_url.split(',').map((url, i) => (
                        <img key={i} src={url.trim()} alt={`Passage image ${i + 1}`} className="max-w-full h-auto rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`${(hasPassage || currentQuestion?.image_url) ? 'w-full xl:w-[40%] xl:pl-4' : 'w-full'} overflow-y-auto`}>
              <div className="prose max-w-none mb-6"><p className="text-foreground leading-relaxed mb-4 preserve-whitespace"><Latex>{currentQuestion?.question_text}</Latex></p></div>

              <div className="space-y-3">
                {currentQuestion?.options.length > 0 ? (
                  currentQuestion?.options.map((option) => {
                    const userAnswer = getUserAnswerForCurrentQuestion();
                    const isSelected = userAnswer === option.data_option;
                    const isCorrect = option.is_correct;

                    let bgClass = '';
                    if (isCorrect) {
                      bgClass = 'bg-green-100 border-green-500';
                    } else if (isSelected && !isCorrect) {
                      bgClass = 'bg-red-100 border-red-500';
                    }

                    return (
                      <div key={option.data_option} className={`flex items-center gap-3 p-4 border rounded-lg ${bgClass}`}>
                        <div className="font-medium text-foreground">{option.label}.</div>
                        <div className="flex flex-col gap-2 flex-grow">
                          <div className="text-foreground preserve-whitespace"><Latex>{option.option_text}</Latex></div>
                          {option.option_image_url && (
                            <img
                              src={option.option_image_url}
                              alt={`Option ${option.label}`}
                              className="max-w-[200px] h-auto rounded border border-border"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div>
                    <p>Your answer: {userAnswers[currentQuestion?.qid] || "Not Answered"}</p>
                    <p>Correct answer: {currentQuestion?.correct_option_data}</p>
                  </div>
                )}
              </div>
              {currentQuestion?.explanation && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Explanation</h4>
                  <div className="prose max-w-none dark:prose-invert text-foreground"><Latex>{currentQuestion?.explanation}</Latex></div>
                </div>
              )}
              {currentQuestion?.solution_text && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Solution</h4>
                  <div className="prose max-w-none dark:prose-invert text-foreground"><Latex>{currentQuestion?.solution_text}</Latex></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 sm:pt-6 border-t border-border gap-4">
            {onReturnToDashboard && (
              <Button variant="outline" onClick={onReturnToDashboard}>
                Return to Dashboard
              </Button>
            )}
            {customActions}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>Previous</Button>
              <Button onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}