import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, PenTool, CheckCircle, AlertCircle, RefreshCw, Save } from "lucide-react";
import {
    useEssayTopics,
    useGenerateEssayTopics,
    useXATEssayQuestions,
    useEssays,
    useCreateEssay,
    useUpdateEssay,
    useSubmitEssay,
    useEssayReview,
    EssayTopic,
    XATEssayQuestion,
    Essay
} from "@/services/essay";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Froala Editor
import "froala-editor/css/froala_style.min.css";
import "froala-editor/css/froala_editor.pkgd.min.css";
import FroalaEditorComponent from "react-froala-wysiwyg";

const DOMAINS = [
    { value: "science", label: "Science & Technology" },
    { value: "politics", label: "Politics & Governance" },
    { value: "philosophy", label: "Philosophy & Ethics" },
    { value: "business", label: "Business & Economics" },
    { value: "social", label: "Social Issues" },
    { value: "environment", label: "Environment & Sustainability" },
    { value: "arts", label: "Arts & Culture" },
    { value: "current_affairs", label: "Current Affairs" },
];

export default function XatEssayPage() {
    const { toast } = useToast();
    const [location, setLocation] = useLocation();
    const [selectedDomain, setSelectedDomain] = useState<string>("philosophy");
    const [activeTab, setActiveTab] = useState<"topics" | "questions" | "write" | "review" | "history">("topics");
    const [selectedTopic, setSelectedTopic] = useState<EssayTopic | null>(null);
    const [selectedXATQuestion, setSelectedXATQuestion] = useState<XATEssayQuestion | null>(null);
    const [currentEssay, setCurrentEssay] = useState<Essay | null>(null);
    const [editorContent, setEditorContent] = useState("");
    const [viewSolution, setViewSolution] = useState<XATEssayQuestion | null>(null);

    // Queries & Mutations
    const { data: topics, isLoading: isLoadingTopics } = useEssayTopics(selectedDomain);
    const { data: xatQuestions, isLoading: isLoadingXATQuestions } = useXATEssayQuestions();
    const { data: essays, isLoading: isLoadingEssays } = useEssays();
    const generateTopicsMutation = useGenerateEssayTopics();
    const createEssayMutation = useCreateEssay();
    const updateEssayMutation = useUpdateEssay();
    const submitEssayMutation = useSubmitEssay();

    // Review query (only enabled if we have a submitted essay)
    const { data: review, isLoading: isLoadingReview } = useEssayReview(currentEssay?.id || "");

    // Handle topic generation
    const handleGenerateTopics = () => {
        generateTopicsMutation.mutate({ domain: selectedDomain }, {
            onSuccess: () => {
                toast({ title: "Topics Generated", description: "New essay topics have been generated." });
            },
            onError: () => {
                toast({ title: "Error", description: "Failed to generate topics.", variant: "destructive" });
            }
        });
    };

    // Handle starting an essay
    const handleStartEssay = (topic: EssayTopic) => {
        setSelectedTopic(topic);
        setSelectedXATQuestion(null);
        createEssayMutation.mutate({
            title: topic.title,
            topic_id: topic.id,
            content: ""
        }, {
            onSuccess: (essay) => {
                setCurrentEssay(essay);
                setEditorContent("");
                setActiveTab("write");
                toast({ title: "Essay Started", description: "You can now start writing." });
            },
            onError: () => {
                toast({ title: "Error", description: "Failed to start essay.", variant: "destructive" });
            }
        });
    };

    // Handle starting a XAT essay
    const handleStartXATEssay = (question: XATEssayQuestion) => {
        setSelectedXATQuestion(question);
        setSelectedTopic(null);
        createEssayMutation.mutate({
            title: `Essay for ${question.qid}`,
            xat_question_id: question.qid,
            content: ""
        }, {
            onSuccess: (essay) => {
                setCurrentEssay(essay);
                setEditorContent("");
                setActiveTab("write");
                toast({ title: "Essay Started", description: "You can now start writing." });
            },
            onError: () => {
                toast({ title: "Error", description: "Failed to start essay.", variant: "destructive" });
            }
        });
    };

    const handleContinueEssay = (essay: Essay) => {
        setCurrentEssay(essay);
        setEditorContent(essay.content);
        // Try to find topic or question
        if (essay.topic_id && topics) {
            const topic = topics.find(t => t.id === essay.topic_id);
            if (topic) setSelectedTopic(topic);
        } else if (essay.xat_question_id && xatQuestions) {
            const question = xatQuestions.find(q => q.qid === essay.xat_question_id);
            if (question) setSelectedXATQuestion(question);
        }

        if (essay.status === 'submitted' || essay.status === 'reviewed') {
            setActiveTab("review");
        } else {
            setActiveTab("write");
        }
    };

    // Handle saving essay
    const handleSaveEssay = () => {
        if (!currentEssay) return;

        // Simple word count estimation
        const wordCount = editorContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;

        updateEssayMutation.mutate({
            id: currentEssay.id,
            data: {
                content: editorContent,
                word_count: wordCount
            }
        }, {
            onSuccess: () => {
                toast({ title: "Saved", description: "Essay saved successfully." });
            }
        });
    };

    // Auto-save effect (every 30 seconds)
    useEffect(() => {
        if (activeTab === "write" && currentEssay && !updateEssayMutation.isPending) {
            const timer = setInterval(() => {
                handleSaveEssay();
            }, 30000);
            return () => clearInterval(timer);
        }
    }, [activeTab, currentEssay, editorContent]);

    // Handle submitting essay
    const handleSubmitEssay = () => {
        if (!currentEssay) return;

        // Save first
        handleSaveEssay();

        submitEssayMutation.mutate(currentEssay.id, {
            onSuccess: () => {
                setActiveTab("review");
                toast({ title: "Submitted", description: "Essay submitted for AI review." });
            },
            onError: () => {
                toast({ title: "Error", description: "Failed to submit essay.", variant: "destructive" });
            }
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppHeader />

            <main className="flex-1 container mx-auto py-8 px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">XAT Essay Prep</h1>
                        <p className="text-muted-foreground mt-1">
                            Practice essay writing with AI-generated topics and get instant feedback.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-muted p-1 rounded-lg overflow-x-auto">
                        <Button
                            variant={activeTab === "topics" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("topics")}
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Topics
                        </Button>
                        <Button
                            variant={activeTab === "questions" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("questions")}
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            XAT Questions
                        </Button>
                        <Button
                            variant={activeTab === "write" ? "default" : "ghost"}
                            size="sm"
                            disabled={!currentEssay}
                            onClick={() => setActiveTab("write")}
                        >
                            <PenTool className="w-4 h-4 mr-2" />
                            Write
                        </Button>
                        <Button
                            variant={activeTab === "review" ? "default" : "ghost"}
                            size="sm"
                            disabled={!currentEssay || currentEssay.status === "draft"}
                            onClick={() => setActiveTab("review")}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Review
                        </Button>
                        <Button
                            variant={activeTab === "history" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("history")}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            History
                        </Button>
                    </div>
                </div>

                {/* SOLUTION DIALOG */}
                <Dialog open={!!viewSolution} onOpenChange={(open) => !open && setViewSolution(null)}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Solution / Analysis</DialogTitle>
                            <DialogDescription>
                                Sample solution or analysis for this question.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                            {viewSolution?.solution_text ? (
                                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {viewSolution.solution_text}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No solution available for this question.
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* TOPICS TAB */}
                {activeTab === "topics" && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Select a Domain</CardTitle>
                                <CardDescription>Choose a topic domain to generate relevant essay prompts.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
                                <div className="w-full sm:w-[300px] space-y-2">
                                    <label className="text-sm font-medium">Domain</label>
                                    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select domain" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DOMAINS.map(d => (
                                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleGenerateTopics}
                                    disabled={generateTopicsMutation.isPending}
                                >
                                    {generateTopicsMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                    )}
                                    Generate New Topics
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {isLoadingTopics ? (
                                <div className="col-span-2 flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : topics && topics.length > 0 ? (
                                topics.map((topic) => (
                                    <Card key={topic.id} className="flex flex-col">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xl leading-tight">{topic.title}</CardTitle>
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize
                            ${topic.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                                            topic.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                                                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                                                        {topic.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                            <CardDescription className="mt-2">{topic.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <div className="text-sm text-muted-foreground mb-4">
                                                <strong>Context:</strong> {topic.context.substring(0, 150)}...
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase">Key Points:</p>
                                                <ul className="list-disc list-inside text-sm">
                                                    {topic.key_points.slice(0, 2).map((point, i) => (
                                                        <li key={i}>{point}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full" onClick={() => handleStartEssay(topic)}>
                                                Start Writing
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-2 text-center py-12 text-muted-foreground">
                                    No topics found. Generate some topics to get started!
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* QUESTIONS TAB */}
                {activeTab === "questions" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">XAT Previous Year & Practice Questions</h2>
                        <div className="grid grid-cols-1 gap-6">
                            {isLoadingXATQuestions ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : xatQuestions && xatQuestions.length > 0 ? (
                                xatQuestions.map((q) => (
                                    <Card key={q.id}>
                                        <CardHeader>
                                            <CardTitle>{q.qid}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {q.passage_text && (
                                                <div className="mb-4 p-4 bg-muted rounded-md text-sm italic">
                                                    {q.passage_text}
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap">{q.question_text}</p>
                                        </CardContent>
                                        <CardFooter className="flex justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                {essays?.filter(e => e.xat_question_id === q.qid).length || 0} attempts
                                            </div>
                                            <Button onClick={() => handleStartXATEssay(q)}>
                                                Start Essay
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    No questions found.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === "history" && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Your Essay History</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {isLoadingEssays ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : essays && essays.length > 0 ? (
                                essays.map((essay) => (
                                    <Card key={essay.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{essay.title}</CardTitle>
                                                    <CardDescription>
                                                        {new Date(essay.created_at).toLocaleDateString()} • {essay.word_count} words
                                                    </CardDescription>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-medium capitalize
                                                    ${essay.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                                                        essay.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                    {essay.status}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardFooter className="flex gap-2">
                                            <Button variant="outline" className="flex-1" onClick={() => handleContinueEssay(essay)}>
                                                {essay.status === 'draft' ? 'Continue Writing' : 'View Review'}
                                            </Button>
                                            {essay.xat_question_id && (
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        const q = xatQuestions?.find(q => q.qid === essay.xat_question_id);
                                                        if (q) setViewSolution(q);
                                                    }}
                                                >
                                                    View Solution
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    No essays found. Start writing!
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* WRITE TAB */}
                {activeTab === "write" && currentEssay && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{currentEssay.title}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {selectedTopic?.description || selectedXATQuestion?.qid}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleSaveEssay} disabled={updateEssayMutation.isPending}>
                                            <Save className="w-4 h-4 mr-2" />
                                            {updateEssayMutation.isPending ? "Saving..." : "Save Draft"}
                                        </Button>
                                        <Button onClick={handleSubmitEssay} disabled={submitEssayMutation.isPending}>
                                            {submitEssayMutation.isPending ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                            )}
                                            Submit for Review
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="prose-editor">
                                    <FroalaEditorComponent
                                        tag="textarea"
                                        model={editorContent}
                                        onModelChange={setEditorContent}
                                        config={{
                                            placeholderText: "Start writing your essay here...",
                                            charCounterCount: true,
                                            toolbarButtons: [
                                                'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', '|',
                                                'fontFamily', 'fontSize', 'color', 'inlineStyle', 'paragraphStyle', '|',
                                                'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', '-',
                                                'insertLink', 'insertTable', '|',
                                                'specialCharacters', 'insertHR', 'selectAll', 'clearFormatting', '|',
                                                'print', 'help', 'html', '|',
                                                'undo', 'redo'
                                            ],
                                            heightMin: 400,
                                            heightMax: 600,
                                        }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {selectedTopic && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Topic Context & Key Points</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-1">Context</h4>
                                        <p className="text-sm text-muted-foreground">{selectedTopic.context}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Key Points to Address</h4>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                                            {selectedTopic.key_points.map((point, i) => (
                                                <li key={i}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {selectedXATQuestion && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Question Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {selectedXATQuestion.passage_text && (
                                        <div>
                                            <h4 className="font-semibold mb-1">Passage</h4>
                                            <p className="text-sm text-muted-foreground italic">{selectedXATQuestion.passage_text}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-semibold mb-1">Question</h4>
                                        <p className="text-sm text-muted-foreground">{selectedXATQuestion.question_text}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* REVIEW TAB */}
                {activeTab === "review" && (
                    <div className="space-y-6">
                        {isLoadingReview ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                                <h3 className="text-xl font-semibold">Analyzing your essay...</h3>
                                <p className="text-muted-foreground max-w-md mt-2">
                                    Our AI is reviewing your essay for structure, coherence, arguments, and language. This usually takes about 10-20 seconds.
                                </p>
                            </div>
                        ) : review ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Card className="bg-primary/5 border-primary/20">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Score</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-4xl font-bold text-primary">{review.overall_score}/100</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Structure</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{review.structure_score}/100</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Coherence</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{review.coherence_score}/100</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Arguments</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{review.arguments_score}/100</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-green-600">
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Strengths
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {review.detailed_feedback.strengths.map((s, i) => (
                                                    <li key={i} className="flex items-start text-sm">
                                                        <span className="mr-2">•</span>
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-amber-600">
                                                <AlertCircle className="w-5 h-5 mr-2" />
                                                Areas for Improvement
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2">
                                                {review.improvement_suggestions.map((s, i) => (
                                                    <li key={i} className="flex items-start text-sm">
                                                        <span className="mr-2">•</span>
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Detailed Analysis</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold mb-2 text-primary">Structure Analysis</h4>
                                            <p className="text-sm text-muted-foreground">{review.detailed_feedback.structure_analysis}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2 text-primary">Coherence & Flow</h4>
                                            <p className="text-sm text-muted-foreground">{review.detailed_feedback.coherence_analysis}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2 text-primary">Arguments & Critical Thinking</h4>
                                            <p className="text-sm text-muted-foreground">{review.detailed_feedback.arguments_analysis}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2 text-primary">Language & Vocabulary</h4>
                                            <p className="text-sm text-muted-foreground">{review.detailed_feedback.language_analysis}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex justify-center pt-4">
                                    <Button onClick={() => {
                                        setActiveTab("topics");
                                        setCurrentEssay(null);
                                        setSelectedTopic(null);
                                        setSelectedXATQuestion(null);
                                    }}>
                                        Start New Essay
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No review available yet. Please submit your essay first.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <AppFooter />
        </div>
    );
}
