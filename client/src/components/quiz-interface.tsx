import { useState, useEffect } from "react";
import Latex from "react-latex-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PracticeTest, Question, UserAnswer, TestSession } from "@shared/schema";
import { PanelLeftClose, PanelRightClose } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface QuizInterfaceProps {
  test: PracticeTest;
  session: TestSession;
  onExit: () => void;
}

export function QuizInterface({ test, session, onExit }: QuizInterfaceProps) {
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: string}>(() => {
    if (session.answers && typeof session.answers === 'object') {
      return Object.entries(session.answers).reduce((acc, [qid, ans]) => {
        acc[qid] = (ans as UserAnswer).selectedAnswer || '';
        return acc;
      }, {} as {[key: string]: string});
    }
    return {};
  });
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(new Set());
  const [timeElapsed, setTimeElapsed] = useState(0);

  const questions = test.questions as (Question & { image_url?: string })[];
  const currentQuestion = questions[currentQuestionIndex];
  const hasPassage = currentQuestion.passage_text && currentQuestion.passage_text !== "For the following questions answer them individually";

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Autosave effect
  useEffect(() => {
    const autosaveTimer = setInterval(() => {
      const userAnswers: UserAnswer[] = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
        timeSpent: 0, // This would need more detailed tracking
        isMarkedForReview: false,
      }));

      apiClient.patch(`/test-sessions/${session.id}`, { answers: userAnswers })
        .catch(error => console.error("Failed to save progress:", error));
    }, 10000); // Save every 10 seconds

    return () => clearInterval(autosaveTimer);
  }, [answers, session.id]);

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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Test Header (Sticky) */}
      <div className="bg-muted/50 p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">{test.title}</h3>
            <p className="text-sm text-muted-foreground">{test.subject} Section</p>
          </div>
          <div className="flex items-center gap-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsPaletteVisible(!isPaletteVisible)}
              className="hidden lg:flex"
            >
              {isPaletteVisible ? <PanelLeftClose className="h-4 w-4 mr-2" /> : <PanelRightClose className="h-4 w-4 mr-2" />}
              {isPaletteVisible ? "Hide Palette" : "Show Palette"}
            </Button>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground" data-testid="timer-display">
                {formatTime(timeElapsed)}
              </div>
              <div className="text-xs text-muted-foreground">Time Elapsed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground" data-testid="question-counter">
                {currentQuestionIndex + 1}/{test.totalQuestions}
              </div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question Navigation (Scrollable) */}
        {isPaletteVisible && (
          <div className="lg:w-1/8 bg-muted/30 p-6 border-r border-border overflow-y-auto">
            <h4 className="font-semibold text-foreground mb-4">Question Palette</h4>
            <div className="grid grid-cols-5 lg:grid-cols-6 gap-1 mb-6">
              {questions.map((question, index) => {
                const isAnswered = answers[question.qid] !== undefined;
                const correctOption = question.options.find(opt => opt.is_correct);
                const isCorrect = isAnswered && correctOption && answers[question.qid] === correctOption.data_option;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded text-xs font-semibold transition-colors hover-elevate ${
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
            <span className="text-sm font-medium text-muted-foreground" data-testid="question-info">
              Question {currentQuestionIndex + 1} of {test.totalQuestions}
            </span>
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
                        ? currentQuestion.correct_option_data || currentQuestion.solution_text || "No solution provided."
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
