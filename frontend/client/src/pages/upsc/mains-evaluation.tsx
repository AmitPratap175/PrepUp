import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  useMainsQuestions, 
  useMainsQuestion, 
  useEvaluateMainsAnswer, 
  useMainsEvaluations, 
  useMainsEvaluation 
} from "@/services/mains";
import { 
  BookOpen, 
  Clock, 
  BrainCircuit, 
  AlertCircle, 
  Loader2, 
  PenTool, 
  Award, 
  Sparkles, 
  History, 
  CheckCircle2, 
  ChevronRight, 
  Copy, 
  Check, 
  FileText,
  HelpCircle
} from "lucide-react";

export default function MainsEvaluationPage() {
  const { toast } = useToast();
  
  // Selected state
  const [selectedGsPaper, setSelectedGsPaper] = useState<number | undefined>(undefined);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  
  // Local edit state
  const [userAnswer, setUserAnswer] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [showKeyPoints, setShowKeyPoints] = useState(false);

  // API Hooks
  const { data: questionsData, isLoading: isLoadingQuestions } = useMainsQuestions(selectedGsPaper);
  const { data: questionDetails, isLoading: isLoadingQuestionDetails } = useMainsQuestion(selectedQuestionId || "");
  const { data: evaluationsHistory, isLoading: isLoadingHistory } = useMainsEvaluations();
  const { data: evaluationDetails, isLoading: isLoadingEvaluationDetails } = useMainsEvaluation(selectedEvaluationId || "");
  
  const evaluateAnswerMutation = useEvaluateMainsAnswer();

  // Reset answer when question changes
  useEffect(() => {
    setUserAnswer("");
    setShowModelAnswer(false);
    setShowKeyPoints(false);
  }, [selectedQuestionId]);

  // Word count helper
  const wordCount = userAnswer.trim() === "" ? 0 : userAnswer.trim().split(/\s+/).length;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    toast({
      title: "Copied to clipboard",
      description: `Successfully copied ${label}.`,
    });
  };

  const handleClear = () => {
    setUserAnswer("");
  };

  const handleSubmit = async () => {
    if (!selectedQuestionId) return;
    if (userAnswer.trim().length < 50) {
      toast({
        title: "Answer too short",
        description: "Please write at least 50 words to receive a meaningful evaluation.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await evaluateAnswerMutation.mutateAsync({
        questionId: selectedQuestionId,
        userAnswer: userAnswer
      });
      
      setSelectedEvaluationId(response.evaluation_id);
      toast({
        title: "Evaluation complete",
        description: "Your answer has been graded. Review the detailed feedback now.",
      });
    } catch (err: any) {
      toast({
        title: "Evaluation failed",
        description: err.message || "Failed to grade your answer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const questions = questionsData?.questions || [];
  const evaluations = evaluationsHistory?.evaluations || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-55 text-slate-900 bg-slate-50">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-violet-600 hover:bg-violet-700 text-white font-semibold">MAINS WORKSPACE</Badge>
              <Badge variant="outline" className="border-slate-200 text-slate-500 bg-white">GS I-IV Subjective</Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <PenTool className="h-7 w-7 text-violet-600" />
              UPSC Mains Answer Evaluator
            </h1>
            <p className="text-slate-600 mt-1 max-w-2xl">
              Practice descriptive answer writing. Receive multi-dimensional scoring and constructive feedback aligned with UPSC conventions and model answers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT PANEL: Filters, Questions & History */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* GS Paper Filter & Question List */}
            <Card className="border-slate-200 bg-white shadow-sm text-slate-900">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                  <BookOpen className="h-5 w-5 text-violet-600" />
                  Select Practice Question
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Select a GS paper to see model questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Paper Selector Chips */}
                <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setSelectedGsPaper(undefined)}
                    className={`py-1.5 px-1 text-xs font-semibold rounded-md transition-all ${
                      selectedGsPaper === undefined
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All
                  </button>
                  {[1, 2, 3, 4].map((paper) => (
                    <button
                      key={paper}
                      onClick={() => setSelectedGsPaper(paper)}
                      className={`py-1.5 px-1 text-xs font-semibold rounded-md transition-all ${
                        selectedGsPaper === paper
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      GS-{paper}
                    </button>
                  ))}
                </div>

                {/* Questions Scrollable List */}
                <ScrollArea className="h-[280px] pr-2">
                  {isLoadingQuestions ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                    </div>
                  ) : questions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      No questions available for this paper selection.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {questions.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => {
                            setSelectedQuestionId(q.id);
                            setSelectedEvaluationId(null);
                          }}
                          className={`w-full text-left p-3 rounded-lg border text-sm transition-all duration-200 ${
                            selectedQuestionId === q.id
                              ? "bg-violet-50 border-violet-500 text-violet-950 shadow-sm"
                              : "bg-slate-55/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 bg-slate-50/50"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                              GS-Paper {q.gs_paper}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                              {q.syllabus_topic}
                            </span>
                          </div>
                          <p className="line-clamp-2 font-medium leading-relaxed text-slate-800">{q.question_text}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Past Evaluations list */}
            <Card className="border-slate-200 bg-white shadow-sm text-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                  <History className="h-5 w-5 text-indigo-600" />
                  Your Submission History
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Review grades of previous submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  </div>
                ) : evaluations.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No answers submitted for evaluation yet.
                  </div>
                ) : (
                  <ScrollArea className="h-[250px] divide-y divide-slate-100">
                    {evaluations.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          setSelectedEvaluationId(ev.id);
                          setSelectedQuestionId(ev.question_id);
                        }}
                        className={`p-4 cursor-pointer hover:bg-indigo-50/30 transition-colors ${
                          selectedEvaluationId === ev.id
                            ? "bg-slate-50 border-l-4 border-violet-600"
                            : ""
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-500">
                            GS-{ev.gs_paper}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ev.evaluated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 line-clamp-1 mb-2">
                          {ev.question_text}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">AI Evaluation</span>
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Score: {ev.overall_score.toFixed(1)} / 10
                          </span>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT PANEL: Workspace & AI Grade Panel */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* If NO question selected */}
            {!selectedQuestionId && (
              <Card className="border-slate-200 bg-white shadow-sm p-12 text-center h-[500px] flex flex-col items-center justify-center">
                <div className="p-4 rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-4">
                  <PenTool className="h-12 w-12 text-violet-600/60" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Descriptive Answer Workspace</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm">
                  Select a GS Mains question from the sidebar to begin drafting your subjective response. Write your answer, track your word limit, and submit for instant grading.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => {
                    if (questions.length > 0) {
                      setSelectedQuestionId(questions[0].id);
                    }
                  }} className="bg-violet-600 hover:bg-violet-700 text-white">
                    Load First Question
                  </Button>
                </div>
              </Card>
            )}

            {/* Workspace & Editor Card */}
            {selectedQuestionId && questionDetails && (
              <div className="space-y-6">
                
                {/* Active Question Info */}
                <Card className="border-slate-200 bg-white shadow-sm text-slate-900">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex justify-between items-center gap-2 mb-2">
                      <Badge className="bg-violet-100 hover:bg-violet-200 text-violet-700 border border-violet-200 uppercase">
                        GS Paper {questionDetails.gs_paper}
                      </Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        Topic: {questionDetails.syllabus_topic}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold leading-relaxed text-slate-900">
                      {questionDetails.question_text}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-slate-500 font-medium">Recommended Limit:</span>
                      <span className="text-slate-600">150 or 250 words</span>
                      <span className="text-slate-300 mx-2">|</span>
                      <span className="text-slate-500 font-medium font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Expected key points: {questionDetails.key_points.length}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowModelAnswer(!showModelAnswer)}
                      className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 h-8 text-[11px]"
                    >
                      <BookOpen className="h-3.5 w-3.5 mr-1 text-violet-600" />
                      {showModelAnswer ? "Hide Model Answer" : "View Model Answer"}
                    </Button>
                  </CardContent>
                </Card>

                {showModelAnswer && questionDetails.model_answer && (
                  <Card className="border-slate-200 bg-white shadow-sm text-slate-900 mt-2">
                    <CardHeader className="pb-3 border-b border-slate-100 flex flex-row justify-between items-center">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Sparkles className="h-4.5 w-4.5 text-violet-600" />
                          Reference Model Answer
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs">
                          High-yield response structure
                        </CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopy(questionDetails.model_answer || "", "model answer")}
                        className="h-8 text-slate-500 hover:text-slate-800"
                      >
                        {copiedText === "model answer" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {questionDetails.model_answer}
                      </p>
                      
                      {questionDetails.key_points.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expected Key Points</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {questionDetails.key_points.map((pt, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-mono">
                                {pt}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Editor & Actions */}
                {!selectedEvaluationId && (
                  <Card className="border-slate-200 bg-white shadow-sm text-slate-900">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-violet-600" />
                          Write Your Answer below:
                        </label>
                        <div className="text-xs text-slate-500 font-mono">
                          Word Count: <span className={`font-bold ${wordCount > 250 ? 'text-amber-600' : 'text-violet-600'}`}>{wordCount}</span> / 250
                        </div>
                      </div>

                      <Textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Structure your answer with:
1. Introduction: Frame the core issue, provide constitutional context or key definitions (20-30 words).
2. Body Paragraphs: Multi-dimensional arguments (PEESTLE), case laws, statistics, diagrams pointers (120-150 words).
3. Conclusion: Optimistic way forward, committee recommendations (30-40 words)..."
                        className="min-h-[350px] bg-slate-50/50 border-slate-200 text-slate-800 placeholder-slate-400 focus-visible:ring-violet-500 text-base leading-relaxed p-4 rounded-xl resize-y"
                        disabled={evaluateAnswerMutation.isPending}
                      />

                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                        <Button
                          variant="ghost"
                          onClick={handleClear}
                          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                          disabled={evaluateAnswerMutation.isPending}
                        >
                          Clear Text
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          disabled={evaluateAnswerMutation.isPending}
                          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center gap-2 px-6"
                        >
                          {evaluateAnswerMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              AI Grading...
                            </>
                          ) : (
                            <>
                              <BrainCircuit className="h-4 w-4" />
                              Evaluate Answer
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Submitting Evaluation Loader */}
                {evaluateAnswerMutation.isPending && (
                  <Card className="border-violet-200 bg-violet-50/50 shadow-sm p-12 text-center flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-violet-600 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-violet-700 mb-2">Analyzing Subjective Quality</h3>
                    <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                      Gemini is scoring your introduction, reviewing the body for multi-dimensional perspectives, assessing the conclusion roadmap, and identifying missing factual items.
                    </p>
                  </Card>
                )}

                {/* EVALUATION RESULTS CARD */}
                {selectedEvaluationId && (
                  <div className="space-y-6">
                    {isLoadingEvaluationDetails ? (
                      <Card className="border-slate-200 bg-white shadow-sm p-12 text-center flex flex-col items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                        <p className="text-slate-500 mt-2">Loading detailed score card...</p>
                      </Card>
                    ) : evaluationDetails && (
                      <div className="space-y-6">
                        
                        {/* Overall Card */}
                        <Card className="border-emerald-200 bg-white shadow-md text-slate-900 overflow-hidden relative">
                          <div className="absolute top-0 right-0 p-3 bg-emerald-50 border-b border-l border-emerald-100 text-emerald-700 text-xs font-mono font-bold rounded-bl">
                            EVALUATED AT {new Date(evaluationDetails.evaluated_at).toLocaleDateString()}
                          </div>
                          
                          <CardHeader className="bg-gradient-to-r from-emerald-50/30 to-white border-b border-slate-100 pb-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
                              <div>
                                <CardTitle className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                                  <Award className="h-7 w-7 text-emerald-600" />
                                  AI Evaluation Score Card
                                </CardTitle>
                                <CardDescription className="text-slate-500">
                                  Subjective evaluation metrics compared to ideal parameters
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-xl min-w-[150px] justify-center md:self-end">
                                <div className="text-center">
                                  <div className="text-4xl font-black text-emerald-700">{evaluationDetails.overall_score.toFixed(1)}</div>
                                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Overall Grade</div>
                                </div>
                                <div className="text-slate-400 text-2xl">/</div>
                                <div className="text-slate-500 text-sm font-semibold">10</div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-6">
                            {/* Breakdown Scores */}
                            <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Breakdown of Evaluation Criteria</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              {/* Intro Score */}
                              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center text-sm font-medium">
                                  <span className="text-slate-700">1. Introduction Score</span>
                                  <span className="text-violet-600 font-mono font-bold">{evaluationDetails.intro_score} / 10</span>
                                </div>
                                <Progress value={evaluationDetails.intro_score * 10} className="h-2 bg-slate-200" indicatorClassName="bg-violet-600" />
                              </div>

                              {/* Body Score */}
                              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center text-sm font-medium">
                                  <span className="text-slate-700">2. Body Arguments Score</span>
                                  <span className="text-violet-600 font-mono font-bold">{evaluationDetails.body_score} / 10</span>
                                </div>
                                <Progress value={evaluationDetails.body_score * 10} className="h-2 bg-slate-200" indicatorClassName="bg-violet-600" />
                              </div>

                              {/* Conclusion Score */}
                              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center text-sm font-medium">
                                  <span className="text-slate-700">3. Conclusion Score</span>
                                  <span className="text-violet-600 font-mono font-bold">{evaluationDetails.conclusion_score} / 10</span>
                                </div>
                                <Progress value={evaluationDetails.conclusion_score * 10} className="h-2 bg-slate-200" indicatorClassName="bg-violet-600" />
                              </div>

                              {/* Structure Score */}
                              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center text-sm font-medium">
                                  <span className="text-slate-700">4. Structure & Flow Score</span>
                                  <span className="text-violet-600 font-mono font-bold">{evaluationDetails.structure_score} / 10</span>
                                </div>
                                <Progress value={evaluationDetails.structure_score * 10} className="h-2 bg-slate-200" indicatorClassName="bg-violet-600" />
                              </div>
                            </div>

                            {/* Factual Feedback */}
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 mb-6">
                              <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
                                <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
                                Missing Factual Items (Case Studies, Articles, or Data)
                              </h4>
                              {evaluationDetails.factual_feedback.length === 0 ? (
                                <p className="text-sm text-slate-600">Excellent! You have included the expected key factual reference materials.</p>
                              ) : (
                                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                                  {evaluationDetails.factual_feedback.map((fact, index) => (
                                    <li key={index} className="leading-relaxed">{fact}</li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Structural Feedback */}
                            <div className="bg-slate-55 border border-slate-200 rounded-xl p-5 bg-slate-50">
                              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                                <Sparkles className="h-4.5 w-4.5 text-violet-600" />
                                Structural & Stylistic Recommendations
                              </h4>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {evaluationDetails.structural_feedback}
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Toggle Panels for Model Answer & User Answer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* User Written Answer Card */}
                          <Card className="border-slate-200 bg-white shadow-sm text-slate-900">
                            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row justify-between items-center">
                              <div>
                                <CardTitle className="text-base font-bold text-slate-900">Your Submission</CardTitle>
                                <CardDescription className="text-xs text-slate-500">What you submitted for grading</CardDescription>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleCopy(evaluationDetails.user_answer, "your submission")}
                                className="h-8 text-slate-500 hover:text-slate-800"
                              >
                                {copiedText === "your submission" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {evaluationDetails.user_answer}
                              </p>
                            </CardContent>
                          </Card>

                          {/* Reference Model Answer Card */}
                          <Card className="border-slate-200 bg-white shadow-sm text-slate-900">
                            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row justify-between items-center">
                              <div>
                                <CardTitle className="text-base font-bold text-slate-900">Reference Model Answer</CardTitle>
                                <CardDescription className="text-xs text-slate-500">High-yield response structure</CardDescription>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleCopy(evaluationDetails.model_answer, "model answer")}
                                className="h-8 text-slate-500 hover:text-slate-800"
                              >
                                {copiedText === "model answer" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {evaluationDetails.model_answer}
                              </p>
                            </CardContent>
                          </Card>

                        </div>

                        {/* expected keywords copy area */}
                        <Card className="border-slate-200 bg-white shadow-sm text-slate-900">
                          <CardHeader>
                            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                              <HelpCircle className="h-4.5 w-4.5 text-indigo-600" />
                              Expected Facts & Core Keywords Reference Panel
                            </CardTitle>
                            <CardDescription className="text-slate-500 text-xs">
                              Copy these critical keywords and regulatory commissions directly into your personal revision logs
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {questionDetails.key_points.map((pt, index) => (
                                <div 
                                  key={index}
                                  onClick={() => handleCopy(pt, `keyword "${pt}"`)}
                                  className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-mono text-slate-700 cursor-pointer transition-all duration-150"
                                >
                                  <span>{pt}</span>
                                  <Copy className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Navigation button back to write workspace */}
                        <div className="flex justify-end pt-4">
                          <Button 
                            onClick={() => {
                              setSelectedEvaluationId(null);
                              setUserAnswer(evaluationDetails.user_answer);
                            }}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 font-semibold"
                          >
                            Edit and Try Again
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            )}

          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
