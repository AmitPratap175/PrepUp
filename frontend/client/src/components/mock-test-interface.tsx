import { useState, useEffect, useMemo, createContext, useContext, useCallback } from "react";
import Latex from "react-latex-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PracticeTest, Question, UserAnswer } from "@shared/schema";
import type { TestState, QuestionStatus } from "@/lib/types";
import { PanelLeftClose, PanelRightClose, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot"
import { cva, VariantProps } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-[var(--sidebar-width)] flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-[var(--sidebar-width)] p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-[var(--sidebar-width)] bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4))]"
            : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4)+2px)]"
            : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

interface MockTestInterfaceProps {
  test: PracticeTest;
  onSubmit: (answers: UserAnswer[], timeSpent: number) => void;
}

const SECTIONS = ["varc", "dilr", "quants"];
const SECTION_TIME = 40 * 60; // 40 minutes in seconds

function MockTestInterfaceContent({ test, onSubmit }: MockTestInterfaceProps) {
  const { open: isPaletteVisible, toggleSidebar } = useSidebar();
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
      <div className="bg-muted/50 p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">{test.title}</h3>
            <p className="text-sm text-muted-foreground">{SECTIONS[currentSectionIndex].toUpperCase()} Section</p>
          </div>
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSidebar}
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
                {testState.currentQuestionIndex + 1}/{questions.length}
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

      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsible="offcanvas" side="right" className="lg:w-1/8 bg-muted/30 p-6 border-r border-border overflow-y-auto">
          <SidebarContent>
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
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="relative">
          <SidebarTrigger asChild className="absolute top-1/2 -right-3 z-10">
            <Button variant="outline" size="icon">
              {isPaletteVisible ? <ChevronsRight /> : <ChevronsLeft />}
            </Button>
          </SidebarTrigger>
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
        </SidebarInset>
      </div>
    </div>
  );
}

export default function MockTestInterface(props: MockTestInterfaceProps) {
  return (
    <SidebarProvider>
      <MockTestInterfaceContent {...props} />
    </SidebarProvider>
  )
}
