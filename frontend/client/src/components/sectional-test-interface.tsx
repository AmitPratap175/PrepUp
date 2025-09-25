import { useState, useEffect, useMemo } from "react";
import Latex from "react-latex-next";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PracticeTest, Question, UserAnswer } from "@shared/schema";
import type { TestState, QuestionStatus } from "@/lib/types";
import { PanelLeftClose, PanelRightClose } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CalculatorDialog } from "./ui/calculator";

/**
 * @interface SectionalTestInterfaceProps
 * @property {string} testId - The ID of the sectional test to be taken.
 */
interface SectionalTestInterfaceProps {
  testId: string;
}

/**
 * An interface for taking a timed sectional test.
 *
 * This component fetches the test data based on the provided `testId` and
 * provides a complete testing environment. It includes a timer, question
 * navigation, answer handling, and a confirmation dialog for submission.
 * Results are saved to local storage upon completion.
 *
 * @param {SectionalTestInterfaceProps} props - The props for the component.
 * @returns {JSX.Element} The rendered sectional test interface.
 */
export default function SectionalTestInterface({ testId }: SectionalTestInterfaceProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: test, isLoading: isTestLoading } = useQuery<PracticeTest>({
    queryKey: [`/api/sectional-tests/${testId}`]
  });

  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    answers: {},
    markedForReview: new Set(),
    timeRemaining: test?.duration ? test.duration * 60 : 0,
    isCompleted: false,
  });

  const questions = test?.questions || [];
  const currentQuestion = questions[testState.currentQuestionIndex];
  const hasPassage = currentQuestion?.passage_text && currentQuestion?.passage_text !== "For the following questions answer them individually";

  useEffect(() => {
    if (test?.duration && testState.timeRemaining === 0) {
      setTestState(prev => ({
        ...prev,
        timeRemaining: test.duration * 60,
      }));
    }
  }, [test]);

  useEffect(() => {
    if (testState.timeRemaining <= 0) {
      finishTest();
    }

    const timer = setInterval(() => {
      setTestState(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
    }, 1000);

    return () => clearInterval(timer);
  }, [testState.timeRemaining]);

  const finishTest = () => {
    setTestState(prev => ({ ...prev, isCompleted: true }));
    toast({
      title: "Section Finished!",
      description: `You have completed the ${test?.subject.toUpperCase()} section.`,
    });

    const resultData = {
      answers: testState.answers,
      questions: questions,
      timeTaken: (test?.duration || 0) * 60 - testState.timeRemaining,
    };

    localStorage.setItem(`sectionalTestResult-${testId}`, JSON.stringify(resultData));
    navigate(`/sectional-test/result/${testId}`);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionIndex: number): QuestionStatus => {
    const questionId = questions[questionIndex].qid;
    return {
      answered: testState.answers[questionId] !== undefined,
      visited: questionIndex <= testState.currentQuestionIndex,
      markedForReview: testState.markedForReview.has(questionId),
      isCurrent: questionIndex === testState.currentQuestionIndex,
    };
  };

  const handleAnswerSelect = (answer: string) => {
    setTestState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.qid]: answer,
      },
    }));
  };

  const handleMarkForReview = () => {
    setTestState(prev => {
      const newMarked = new Set(prev.markedForReview);
      if (newMarked.has(currentQuestion.qid)) {
        newMarked.delete(currentQuestion.qid);
      } else {
        newMarked.add(currentQuestion.qid);
      }
      return { ...prev, markedForReview: newMarked };
    });
  };

  const handleClearResponse = () => {
    setTestState(prev => {
      const newAnswers = { ...prev.answers };
      delete newAnswers[currentQuestion.qid];
      return { ...prev, answers: newAnswers };
    });
  };

  const navigateToQuestion = (questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setTestState(prev => ({ ...prev, currentQuestionIndex: questionIndex }));
    }
  };

  const handleNext = () => {
    if (testState.currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(testState.currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (testState.currentQuestionIndex > 0) {
      navigateToQuestion(testState.currentQuestionIndex - 1);
    }
  };

  if (isTestLoading) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Loading test...</h2>
            <p className="text-muted-foreground">Please wait</p>
        </div>
    );
  }

  if (!test) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Test not found</h2>
            <p className="text-muted-foreground">This test does not exist or could not be loaded.</p>
        </div>
    );
  }

  if (testState.isCompleted) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Section Finished!</h2>
        <p className="text-muted-foreground">You have completed the {test.subject.toUpperCase()} section.</p>
        <Button onClick={() => navigate(`/sectional-tests`)}>Back to Tests</Button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Section loading...</h2>
            <p className="text-muted-foreground">Please wait</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="bg-muted/50 p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground truncate">{test.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{test.subject} Section</p>
          </div>
          <div className="flex items-center gap-6">

            <div className="text-center">
              <div className="text-lg font-bold text-destructive" data-testid="timer-display">
                {formatTime(testState.timeRemaining)}
              </div>
              <div className="text-xs text-muted-foreground">Time Left</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground" data-testid="question-counter">
                {testState.currentQuestionIndex + 1}/{questions.length}
              </div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <CalculatorDialog />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsConfirmOpen(true)}
              data-testid="button-submit-test"
            >
              Submit Section
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You will not be able to change your answers after submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={finishTest}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        {isPaletteVisible && (
          <div className="w-64 bg-muted/30 p-6 border-r border-border overflow-y-auto">
            <h4 className="font-semibold text-foreground mb-4">Question Palette</h4>
            <div className="grid grid-cols-5 gap-1 mb-6">
              {questions.map((_, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={index}
                    onClick={() => navigateToQuestion(index)}
                    className={`w-8 h-8 rounded text-xs font-semibold transition-colors hover-elevate ${
                      status.isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : status.answered
                        ? 'bg-secondary text-secondary-foreground'
                        : status.markedForReview
                        ? 'bg-orange-500 text-white'
                        : 'bg-card border border-border text-foreground hover:bg-accent'
                    }`}
                    data-testid={`question-nav-${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary rounded"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-secondary rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-card border border-border rounded"></div>
                <span>Not Visited</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground" data-testid="question-info">
              Question {testState.currentQuestionIndex + 1} of {questions.length}
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
                  currentQuestion.options.map((option) => {
                    const isSelected = testState.answers[currentQuestion.qid] === option.data_option;
                    return (
                      <label
                        key={option.data_option}
                        className={`flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer transition-colors hover-elevate ${
                          isSelected ? 'bg-accent border-primary' : 'hover:bg-accent'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.qid}`}
                          value={option.data_option}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(option.data_option)}
                          className="sr-only"
                          data-testid={`option-${option.label.toLowerCase()}`}
                        />
                        <div className="w-5 h-5 border-2 border-border rounded-full flex items-center justify-center">
                          <div className={`w-2.5 h-2.5 bg-primary rounded-full ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
                        </div>
                        <span className="font-medium text-foreground">{option.label}.</span>
                        <span className="text-foreground preserve-whitespace">
                          <Latex>{option.option_text}</Latex>
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <div>
                    <label htmlFor="answer-input" className="block text-sm font-medium text-muted-foreground mb-2">
                      Your Answer:
                    </label>
                    <input
                      type="text"
                      id="answer-input"
                      value={testState.answers[currentQuestion.qid] || ''}
                      onChange={(e) => handleAnswerSelect(e.target.value)}
                      className="block w-full p-2 border border-border rounded-lg bg-input text-foreground"
                      data-testid="answer-input"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-border">
            <div className="space-x-3">
              <Button
                variant="outline"
                onClick={handleClearResponse}
                disabled={!testState.answers[currentQuestion.qid]}
                data-testid="button-clear-response"
              >
                Clear Response
              </Button>
              <Button
                variant="outline"
                onClick={handleMarkForReview}
                className={testState.markedForReview.has(currentQuestion.qid) ? 'bg-orange-100 border-orange-300' : ''}
                data-testid="button-mark-review"
              >
                {testState.markedForReview.has(currentQuestion.qid) ? 'Unmark' : 'Mark for Review'}
              </Button>
            </div>
            <div className="space-x-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={testState.currentQuestionIndex === 0}
                data-testid="button-previous"
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={testState.currentQuestionIndex === questions.length - 1}
                data-testid="button-save-next"
              >
                {testState.currentQuestionIndex === questions.length - 1 ? 'Review' : 'Save & Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
