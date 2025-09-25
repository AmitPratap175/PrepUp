import { useState, useEffect, useMemo } from "react";
import Latex from "react-latex-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PracticeTest, Question, UserAnswer } from "@shared/schema";
import type { TestState, QuestionStatus } from "@/lib/types";
import { PanelLeftClose, PanelRightClose, Calculator as CalculatorIcon } from "lucide-react";
import { Calculator } from "./ui/calculator";

/**
 * @interface MockTestInterfaceProps
 * @property {PracticeTest} test - The mock test data, including all questions.
 * @property {(answers: UserAnswer[], timeSpent: number) => void} onSubmit - Callback function to execute when the test is submitted.
 */
interface MockTestInterfaceProps {
  test: PracticeTest;
  onSubmit: (answers: UserAnswer[], timeSpent: number) => void;
}

const SECTIONS = ["varc", "dilr", "quants"];
const SECTION_TIME = 40 * 60; // 40 minutes in seconds

/**
 * Renders a full mock test interface, divided into timed sections.
 *
 * This component manages the entire state of a mock test, including section
 * timing, question navigation, answer tracking, and review marking. It
 * automatically transitions between sections when the timer expires and
 * handles the final submission of the test.
 *
 * @param {MockTestInterfaceProps} props - The props for the component.
 * @returns {JSX.Element} The rendered mock test interface.
 */
export default function MockTestInterface({ test, onSubmit }: MockTestInterfaceProps) {
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [testState, setTestState] = useState<TestState>({
    currentQuestionIndex: 0,
    answers: {},
    markedForReview: new Set(),
    timeRemaining: SECTION_TIME,
    isCompleted: false,
  });

  const questions = useMemo(() => {
    return (test.questions as (Question & { type: string })[]).filter(
      (q) => q.type === SECTIONS[currentSectionIndex]
    );
  }, [test.questions, currentSectionIndex]);

  const currentQuestion = questions[testState.currentQuestionIndex];
  const hasPassage = currentQuestion?.passage_text && currentQuestion?.passage_text !== "For the following questions answer them individually";

  useEffect(() => {
    if (testState.timeRemaining <= 0) {
      if (currentSectionIndex < SECTIONS.length - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
        setTestState((prev) => ({
          ...prev,
          currentQuestionIndex: 0,
          timeRemaining: SECTION_TIME,
        }));
      } else {
        handleSubmit();
      }
    }

    const timer = setInterval(() => {
      setTestState(prev => ({ ...prev, timeRemaining: prev.timeRemaining - 1 }));
    }, 1000);

    return () => clearInterval(timer);
  }, [testState.timeRemaining, currentSectionIndex]);

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

  const handleSubmit = () => {
    const userAnswers: UserAnswer[] = (test.questions as Question[]).map(question => ({
      questionId: question.qid,
      selectedAnswer: testState.answers[question.qid] || null,
      timeSpent: 0,
      isMarkedForReview: testState.markedForReview.has(question.qid),
    }));

    const totalTimeSpent = (test.duration * 60) - testState.timeRemaining;
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
      <div className="bg-muted/50 p-4 border-b border-border">
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground truncate">{test.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{SECTIONS[currentSectionIndex].toUpperCase()} Section</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">

            <div className="text-center">
              <div className="text-sm sm:text-base font-bold text-destructive" data-testid="timer-display">
                {formatTime(testState.timeRemaining)}
              </div>
              <div className="text-xs text-muted-foreground">Time Left</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-sm sm:text-base font-bold text-foreground" data-testid="question-counter">
                {testState.currentQuestionIndex + 1}/{questions.length}
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
              data-testid="button-submit-test"
            >
              Submit Test
            </Button>
          </div>
        </div>
      </div>

      {isCalculatorVisible && <Calculator onClose={() => setIsCalculatorVisible(false)} />}

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
