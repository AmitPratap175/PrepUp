import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, PenTool, Sparkles, BookOpen, Copy, Check, Trash2, GraduationCap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Essay {
  id: string;
  number: number;
  title: string;
  content: string;
  start_page: number;
}

export default function EssayDailyReadPage() {
  const [, params] = useRoute("/upsc/essays/:id");
  const id = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [essay, setEssay] = useState<Essay | null>(null);
  const [allEssays, setAllEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<string[]>([]);

  // Outline builder states
  const [activeTab, setActiveTab] = useState<'read' | 'outline'>('read');
  const [introHook, setIntroHook] = useState('');
  
  // 3 Structured Dimensions
  const [dim1Type, setDim1Type] = useState('Social');
  const [dim1Text, setDim1Text] = useState('');
  const [dim2Type, setDim2Type] = useState('Economic');
  const [dim2Text, setDim2Text] = useState('');
  const [dim3Type, setDim3Type] = useState('Political');
  const [dim3Text, setDim3Text] = useState('');

  const [evidenceText, setEvidenceText] = useState('');
  const [conclusionText, setConclusionText] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Load draft from localStorage on mount/essay change
  useEffect(() => {
    if (!essay) return;
    try {
      const saved = localStorage.getItem(`essay_outline_draft_${essay.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setIntroHook(parsed.introHook || '');
        setDim1Type(parsed.dim1Type || 'Social');
        setDim1Text(parsed.dim1Text || '');
        setDim2Type(parsed.dim2Type || 'Economic');
        setDim2Text(parsed.dim2Text || '');
        setDim3Type(parsed.dim3Type || 'Political');
        setDim3Text(parsed.dim3Text || '');
        setEvidenceText(parsed.evidenceText || '');
        setConclusionText(parsed.conclusionText || '');
        if (parsed.evaluation) {
          setEvaluation(parsed.evaluation);
        }
      } else {
        // Reset states
        setIntroHook('');
        setDim1Type('Social');
        setDim1Text('');
        setDim2Type('Economic');
        setDim2Text('');
        setDim3Type('Political');
        setDim3Text('');
        setEvidenceText('');
        setConclusionText('');
        setEvaluation(null);
      }
    } catch (e) {
      console.error("Error loading draft", e);
    }
  }, [essay?.id]);

  // Auto-save draft on changes
  useEffect(() => {
    if (!essay) return;
    const draft = {
      introHook,
      dim1Type,
      dim1Text,
      dim2Type,
      dim2Text,
      dim3Type,
      dim3Text,
      evidenceText,
      conclusionText,
      evaluation
    };
    localStorage.setItem(`essay_outline_draft_${essay.id}`, JSON.stringify(draft));
  }, [essay?.id, introHook, dim1Type, dim1Text, dim2Type, dim2Text, dim3Type, dim3Text, evidenceText, conclusionText, evaluation]);

  const handleClearDraft = () => {
    if (window.confirm("Are you sure you want to clear your outline draft?")) {
      setIntroHook('');
      setDim1Type('Social');
      setDim1Text('');
      setDim2Type('Economic');
      setDim2Text('');
      setDim3Type('Political');
      setDim3Text('');
      setEvidenceText('');
      setConclusionText('');
      setEvaluation(null);
      if (essay) {
        localStorage.removeItem(`essay_outline_draft_${essay.id}`);
      }
      toast({ title: "Draft Cleared", description: "Your essay draft workspace has been reset.", variant: "default" });
    }
  };

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({ title: "Copied!", description: "Recommendation copied to clipboard.", variant: "default" });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/20';
    if (rating >= 6) return 'text-amber-500 bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/20';
  };

  const handleEvaluateOutline = async () => {
    if (!essay) return;
    setEvaluating(true);

    const combinedArguments = `
[Dimension 1: ${dim1Type}]
${dim1Text}

[Dimension 2: ${dim2Type}]
${dim2Text}

[Dimension 3: ${dim3Type}]
${dim3Text}
    `.trim();

    try {
      const response = await fetch('/api/essays/evaluate-outline/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          essay_title: essay.title,
          intro_hook: introHook,
          arguments: combinedArguments,
          evidence: evidenceText,
          conclusion: conclusionText
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to evaluate outline");
      }
      const data = await response.json();
      setEvaluation(data);
      toast({ title: "Evaluation Complete", description: "AI has reviewed your essay structure!", variant: "default" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Evaluation Failed", description: e.message || "An error occurred.", variant: "destructive" });
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    try {
      const savedCompleted = localStorage.getItem('upsc_completed_essays');
      if (savedCompleted) setCompleted(JSON.parse(savedCompleted));
    } catch (e) {
      console.error(e);
    }

    fetch('/data/151_essays.json')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: Essay[]) => {
        setAllEssays(data);
        const found = data.find(e => e.id === id);
        if (found) {
          setEssay(found);
        } else {
          toast({ title: "Not Found", description: "Essay not found.", variant: "destructive" });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast({ title: "Error", description: "Could not load essays data.", variant: "destructive" });
        setLoading(false);
      });
  }, [id]);

  const toggleCompletion = () => {
    if (!id) return;
    setCompleted(prev => {
      const isCompleted = prev.includes(id);
      const newCompleted = isCompleted ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('upsc_completed_essays', JSON.stringify(newCompleted));
      if (!isCompleted) {
        toast({ title: "Marked Complete", description: "Great job completing this reading!", variant: "default" });
      }
      return newCompleted;
    });
  };

  const isCompleted = essay && completed.includes(essay.id);

  // Determine prev/next logic
  let prevEssay: Essay | null = null;
  let nextEssay: Essay | null = null;
  if (essay && allEssays.length > 0) {
    const currentIndex = allEssays.findIndex(e => e.id === essay.id);
    if (currentIndex > 0) {
      prevEssay = allEssays[currentIndex - 1];
    }
    if (currentIndex < allEssays.length - 1) {
      nextEssay = allEssays[currentIndex + 1];
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!essay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Essay Not Found</h2>
        <Button onClick={() => setLocation("/upsc/essays")}>Back to Essays</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center w-full">
            <Button variant="ghost" onClick={() => setLocation("/upsc/essays")} className="pl-0 hover:bg-transparent text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={!prevEssay}
                onClick={() => prevEssay && setLocation(`/upsc/essays/${prevEssay.id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={!nextEssay}
                onClick={() => nextEssay && setLocation(`/upsc/essays/${nextEssay.id}`)}
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-primary font-bold mb-1 uppercase tracking-wider">Essay {essay.number}</p>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">{essay.title}</h1>
            </div>
            
            <div className="flex shrink-0 gap-3">
              <Button 
                variant={isCompleted ? "secondary" : "default"} 
                className={isCompleted ? "text-green-600 dark:text-green-400 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40" : ""}
                onClick={toggleCompletion}
              >
                {isCompleted ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Completed</>
                ) : (
                  "Mark as Complete"
                )}
              </Button>
              <Button 
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                onClick={() => {
                  try {
                    localStorage.setItem('mains_answer_active_tab', '151_essays');
                  } catch (e) {}
                  setLocation("/mains-answer");
                }}
              >
                <PenTool className="w-4 h-4 mr-2" /> Write Answer
              </Button>
            </div>
          </div>

          {/* Toggle Tabs */}
          <div className="flex border-b border-border mt-6">
            <Button
              variant="ghost"
              onClick={() => setActiveTab('read')}
              className={`rounded-none border-b-2 px-6 py-3 font-semibold text-sm ${activeTab === 'read' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground'}`}
            >
              📖 Read Essay
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('outline')}
              className={`rounded-none border-b-2 px-6 py-3 font-semibold text-sm ${activeTab === 'outline' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground'}`}
            >
              📝 AI Outline Builder
            </Button>
          </div>

          {activeTab === 'read' ? (
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-6 md:p-10 bg-card">
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary/80">
                  <ReactMarkdown>{essay.content.replace(/([^\n])\n([^\n])/g, '$1 $2')}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
              {/* Left Column: Outline Fields (Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="border-border/50 bg-card/95 backdrop-blur-sm shadow-md">
                  <CardHeader className="border-b border-border/40 pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-foreground font-bold">
                          <GraduationCap className="h-5 w-5 text-primary" />
                          UPSC Essay Outline Workspace
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Structure your arguments using the PEESTLE multi-dimensional approach.
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleClearDraft} className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 transition-colors">
                        <Trash2 className="h-4 w-4 mr-1.5" /> Clear
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {/* Introduction Hook */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-foreground/90 flex items-center gap-1.5">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                          Introduction Hook
                        </label>
                        <span className="text-[10px] text-muted-foreground">{introHook.length} chars</span>
                      </div>
                      <textarea
                        value={introHook}
                        onChange={(e) => setIntroHook(e.target.value)}
                        placeholder="Start with a hook: a striking anecdote, philosophical quote, historical context, or core paradox..."
                        className="w-full min-h-[90px] p-3 text-sm border rounded-lg bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-y"
                      />
                      <p className="text-[10px] text-muted-foreground italic leading-normal">
                        Tip: Connect the hook explicitly to the core essay theme to capture the evaluator's attention.
                      </p>
                    </div>

                    {/* Three Dimensional Arguments */}
                    <div className="space-y-3 pt-2">
                      <label className="text-sm font-semibold text-foreground/90 flex items-center gap-1.5">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                        Three Dimensional Arguments
                      </label>
                      <p className="text-[10px] text-muted-foreground -mt-1 italic">
                        Select a unique dimension for each block to ensure high multi-dimensionality.
                      </p>

                      <div className="space-y-4">
                        {/* Dimension 1 */}
                        <div className="border border-border/40 rounded-lg p-3 bg-muted/20 space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-semibold text-muted-foreground">Dimension #1</span>
                            <Select value={dim1Type} onValueChange={setDim1Type}>
                              <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                                <SelectValue placeholder="Select dimension" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Social">Social / Cultural</SelectItem>
                                <SelectItem value="Economic">Economic</SelectItem>
                                <SelectItem value="Political">Political / Constitutional</SelectItem>
                                <SelectItem value="Environmental">Environmental</SelectItem>
                                <SelectItem value="Ethical">Ethical / Philosophical</SelectItem>
                                <SelectItem value="Technological">Technological / Digital</SelectItem>
                                <SelectItem value="Legal">Legal / Judiciary</SelectItem>
                                <SelectItem value="Historical">Historical</SelectItem>
                                <SelectItem value="Administrative">Administrative / Governance</SelectItem>
                                <SelectItem value="Global">International / Global</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <textarea
                            value={dim1Text}
                            onChange={(e) => setDim1Text(e.target.value)}
                            placeholder={`Core argument for ${dim1Type} dimension, addressing challenges and prospects...`}
                            className="w-full min-h-[70px] p-2 text-sm border border-border/60 rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-y"
                          />
                        </div>

                        {/* Dimension 2 */}
                        <div className="border border-border/40 rounded-lg p-3 bg-muted/20 space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-semibold text-muted-foreground">Dimension #2</span>
                            <Select value={dim2Type} onValueChange={setDim2Type}>
                              <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                                <SelectValue placeholder="Select dimension" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Social">Social / Cultural</SelectItem>
                                <SelectItem value="Economic">Economic</SelectItem>
                                <SelectItem value="Political">Political / Constitutional</SelectItem>
                                <SelectItem value="Environmental">Environmental</SelectItem>
                                <SelectItem value="Ethical">Ethical / Philosophical</SelectItem>
                                <SelectItem value="Technological">Technological / Digital</SelectItem>
                                <SelectItem value="Legal">Legal / Judiciary</SelectItem>
                                <SelectItem value="Historical">Historical</SelectItem>
                                <SelectItem value="Administrative">Administrative / Governance</SelectItem>
                                <SelectItem value="Global">International / Global</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <textarea
                            value={dim2Text}
                            onChange={(e) => setDim2Text(e.target.value)}
                            placeholder={`Core argument for ${dim2Type} dimension, addressing challenges and prospects...`}
                            className="w-full min-h-[70px] p-2 text-sm border border-border/60 rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-y"
                          />
                        </div>

                        {/* Dimension 3 */}
                        <div className="border border-border/40 rounded-lg p-3 bg-muted/20 space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-semibold text-muted-foreground">Dimension #3</span>
                            <Select value={dim3Type} onValueChange={setDim3Type}>
                              <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                                <SelectValue placeholder="Select dimension" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Social">Social / Cultural</SelectItem>
                                <SelectItem value="Economic">Economic</SelectItem>
                                <SelectItem value="Political">Political / Constitutional</SelectItem>
                                <SelectItem value="Environmental">Environmental</SelectItem>
                                <SelectItem value="Ethical">Ethical / Philosophical</SelectItem>
                                <SelectItem value="Technological">Technological / Digital</SelectItem>
                                <SelectItem value="Legal">Legal / Judiciary</SelectItem>
                                <SelectItem value="Historical">Historical</SelectItem>
                                <SelectItem value="Administrative">Administrative / Governance</SelectItem>
                                <SelectItem value="Global">International / Global</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <textarea
                            value={dim3Text}
                            onChange={(e) => setDim3Text(e.target.value)}
                            placeholder={`Core argument for ${dim3Type} dimension, addressing challenges and prospects...`}
                            className="w-full min-h-[70px] p-2 text-sm border border-border/60 rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-y"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quotes and Examples */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-sm font-semibold text-foreground/90 flex items-center gap-1.5">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                        Quotes, Case Studies & Data
                      </label>
                      <textarea
                        value={evidenceText}
                        onChange={(e) => setEvidenceText(e.target.value)}
                        placeholder="Cite supreme court cases, philosophers' quotes, reports (e.g. NITI Aayog), or statistics..."
                        className="w-full min-h-[90px] p-3 text-sm border rounded-lg bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-y"
                      />
                    </div>

                    {/* Conclusion Theme */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-sm font-semibold text-foreground/90 flex items-center gap-1.5">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
                        Conclusion Theme
                      </label>
                      <textarea
                        value={conclusionText}
                        onChange={(e) => setConclusionText(e.target.value)}
                        placeholder="Draft conclusion: Summarize main arguments, provide futuristic vision, and end with an optimistic quote or tie back to hook..."
                        className="w-full min-h-[85px] p-3 text-sm border rounded-lg bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-y"
                      />
                    </div>

                    <Button
                      onClick={handleEvaluateOutline}
                      disabled={evaluating || (!introHook && !dim1Text && !dim2Text && !dim3Text && !evidenceText && !conclusionText)}
                      className="w-full font-bold shadow-sm h-11 bg-primary text-primary-foreground hover:bg-primary/95 transition-all text-sm mt-3"
                    >
                      {evaluating ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating AI Evaluation...</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" /> Evaluate Outline structure</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: AI Feedback (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                {evaluation ? (
                  <Card className="border-border/50 bg-card/95 shadow-md h-full flex flex-col max-h-[660px]">
                    <CardHeader className="bg-primary/[0.03] border-b border-border/40 p-5 shrink-0">
                      <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                          <CardTitle className="text-lg flex items-center gap-2 font-bold text-foreground">
                            <BookOpen className="h-4 w-4 text-primary" />
                            AI Cohesion Review
                          </CardTitle>
                          <CardDescription className="text-[10px]">
                            Real-time structural feedback based on UPSC essay metrics.
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-center shrink-0">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Score</span>
                          <div className={`text-base font-extrabold px-3 py-1 border rounded-lg ${getRatingColor(evaluation.cohesion_rating || 0)}`}>
                            {evaluation.cohesion_rating || 'N/A'}/10
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                      {evaluation.intro_feedback && (
                        <div className="bg-muted/10 border border-border/30 p-3 rounded-lg space-y-1">
                          <h4 className="font-bold text-primary flex items-center gap-1.5">
                            <span>🌅</span> Introduction Hook
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">{evaluation.intro_feedback}</p>
                        </div>
                      )}

                      {evaluation.dimensions_feedback && (
                        <div className="bg-muted/10 border border-border/30 p-3 rounded-lg space-y-1">
                          <h4 className="font-bold text-primary flex items-center gap-1.5">
                            <span>🗺️</span> Dimensional Arguments
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">{evaluation.dimensions_feedback}</p>
                        </div>
                      )}

                      {evaluation.evidence_feedback && (
                        <div className="bg-muted/10 border border-border/30 p-3 rounded-lg space-y-1">
                          <h4 className="font-bold text-primary flex items-center gap-1.5">
                            <span>📚</span> Quotes, Data & Cases
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">{evaluation.evidence_feedback}</p>
                        </div>
                      )}

                      {evaluation.conclusion_feedback && (
                        <div className="bg-muted/10 border border-border/30 p-3 rounded-lg space-y-1">
                          <h4 className="font-bold text-primary flex items-center gap-1.5">
                            <span>🏁</span> Conclusion Theme
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">{evaluation.conclusion_feedback}</p>
                        </div>
                      )}

                      {evaluation.recommended_quotes_and_cases && evaluation.recommended_quotes_and_cases.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <h4 className="font-bold text-primary flex items-center gap-1.5">
                            <span>💡</span> Recommended Quotes & Cases
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {evaluation.recommended_quotes_and_cases.map((rec: string, index: number) => (
                              <div key={index} className="flex justify-between items-start gap-2 bg-primary/[0.02] border border-primary/10 rounded-lg p-2.5 hover:bg-primary/[0.04] transition-all">
                                <span className="text-[11px] text-muted-foreground leading-normal flex-1">
                                  {rec}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                                  onClick={() => handleCopyToClipboard(rec, index)}
                                >
                                  {copiedIndex === index ? (
                                    <Check className="h-3 w-3 text-emerald-500 animate-in fade-in zoom-in" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                        <div className="bg-amber-500/[0.02] border border-amber-500/10 p-3 rounded-lg space-y-1.5 pt-2">
                          <h4 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <span>🛠️</span> Strategic Improvements
                          </h4>
                          <ul className="list-disc pl-4 text-muted-foreground space-y-1 leading-normal">
                            {evaluation.suggestions.map((sug: string, index: number) => (
                              <li key={index}>{sug}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed border-2 border-border/70 flex flex-col items-center justify-center p-8 text-center h-full min-h-[450px] bg-muted/[0.02]">
                    <div className="space-y-4 max-w-sm">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary animate-pulse">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-base text-foreground">AI Review Panel</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Draft your essay structure in the left panel. Choose unique dimensions, outline your introduction hook, quotes, and conclusion theme.
                      </p>
                      <div className="border-t border-border/40 pt-4 mt-2 space-y-2 text-left">
                        <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                          <span className="text-primary font-bold">✓</span>
                          <span><strong>Evaluate Structure</strong>: AI scans for logical flow and cohesion between sections.</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                          <span className="text-primary font-bold">✓</span>
                          <span><strong>PEESTLE Check</strong>: Identifies gaps in Social, Economic, or Political dimensions.</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                          <span className="text-primary font-bold">✓</span>
                          <span><strong>Quote Suggestions</strong>: Receives 2-3 specific quotes and case studies to cite.</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
