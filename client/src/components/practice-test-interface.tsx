import { useState, useEffect } from "react";
import Latex from "react-latex-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PracticeTest, Question, UserAnswer } from "@shared/schema";
import type { TestState, QuestionStatus } from "@/lib/types";
import { PanelLeftClose, PanelRightClose } from "lucide-react";

interface PracticeTestInterfaceProps {
  test: PracticeTest;
  onSubmit: (answers: UserAnswer[], timeSpent: number) => void;
}

export function PracticeTestInterface({ test, onSubmit }: PracticeTestInterfaceProps) {
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    answers: {},
    markedForReview: new Set(),
    timeRemaining: test.duration * 60, // Convert minutes to seconds
    isCompleted: false,
  });

  const questions = test.questions as Question[];
  const currentQuestion = questions[testState.currentQuestionIndex];
  const hasPassage = currentQuestion.passage_text && currentQuestion.passage_text !== "For the following questions answer them individually";

  // Timer effect
  useEffect(() => {
    if (testState.timeRemaining <= 0 || testState.isCompleted) {
      return;
    }

    const timer = setInterval(() => {
      setTestState(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          handleSubmit();
          return { ...prev, timeRemaining: 0, isCompleted: true };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testState.timeRemaining, testState.isCompleted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const handleSubmit = () => {
    const userAnswers: UserAnswer[] = questions.map(question => ({
      questionId: question.qid,
      selectedAnswer: testState.answers[question.qid] || null,
      timeSpent: 0, // This would need to be tracked per question in a real implementation
      isMarkedForReview: testState.markedForReview.has(question.qid),
    }));

    const totalTimeSpent = test.duration * 60 - testState.timeRemaining;
    onSubmit(userAnswers, totalTimeSpent);
    setTestState(prev => ({ ...prev, isCompleted: true }));
  };

  if (testState.isCompleted) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Test Submitted Successfully!</h2>
        <p className="text-muted-foreground">Your answers have been recorded and your results will be available shortly.</p>
      </div>
    );
  }

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
              <div className="text-lg font-bold text-destructive" data-testid="timer-display">
                {formatTime(testState.timeRemaining)}
              </div>
              <div className="text-xs text-muted-foreground">Time Left</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground" data-testid="question-counter">
                {testState.currentQuestionIndex + 1}/{test.totalQuestions}
              </div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleSubmit}
              data-testid="button-submit-test"
            >
              Submit Test
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

        {/* Question Content (Scrollable) */}
        <div className="flex-1 flex flex-col p-8 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground" data-testid="question-info">
              Question {testState.currentQuestionIndex + 1} of {test.totalQuestions}
            </span>
            <span className="text-sm text-muted-foreground">
              Multiple Choice Question
            </span>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {hasPassage && (
              <div className="w-[65%] pr-4 overflow-y-auto">
                <div className="bg-muted/50 p-4 rounded-lg h-full">
                  <h5 className="font-semibold text-foreground mb-2">Passage:</h5>
                  <div className="prose max-w-none text-foreground leading-relaxed preserve-whitespace">
                    <Latex>{currentQuestion.passage_text}</Latex>
                  </div>
                </div>
              </div>
            )}

            <div className={`${hasPassage ? 'w-[35%] pl-4' : 'w-full'} overflow-y-auto`}>
              <div className="prose max-w-none mb-6">
                <p className="text-foreground leading-relaxed mb-4 preserve-whitespace" data-testid="question-text">
                  <Latex>{currentQuestion.question_text}</Latex>
                </p>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
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
                })}
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
