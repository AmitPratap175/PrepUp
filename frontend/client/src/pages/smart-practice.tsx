import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Redirect } from "wouter";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { NewQuizInterface } from "@/components/NewQuizInterface";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PracticeTest, UserAnswer } from "@shared/schema";

export default function SmartPracticePage() {
    const { isAuthenticated } = useAuth();
    const [location, setLocation] = useLocation();
    const { toast } = useToast();

    // Form State
    const [examType, setExamType] = useState("cat");
    const [subject, setSubject] = useState("");
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [questionCount, setQuestionCount] = useState("5");

    // Quiz State
    const [generatedTest, setGeneratedTest] = useState<PracticeTest | null>(null);
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const generateMutation = useMutation({
        mutationFn: async (data: any) => {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/generate-questions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to generate questions');
            }
            return response.json();
        },
        onSuccess: (questions) => {
            // Transform generated questions into a PracticeTest object
            const newTest: PracticeTest = {
                id: `generated-${Date.now()}`,
                title: `Smart Practice: ${topic}`,
                examType: examType,
                subject: subject,
                duration: parseInt(questionCount) * 2, // Estimate 2 mins per question
                totalQuestions: questions.length,
                questions: questions,
            };
            setGeneratedTest(newTest);
            setQuizStarted(true);
            toast({
                title: "Questions Generated!",
                description: `Ready to practice ${topic}.`,
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to generate questions. Please try again.",
                variant: "destructive",
            });
        },
    });

    const handleGenerate = () => {
        if (!subject || !topic) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all fields.",
                variant: "destructive",
            });
            return;
        }

        generateMutation.mutate({
            examType,
            subject,
            topic,
            difficulty,
            count: parseInt(questionCount),
        });
    };

    const handleExitQuiz = () => {
        setQuizStarted(false);
        setGeneratedTest(null);
        setCurrentQuestionIndex(0);
    };

    const handleSubmit = (answers: UserAnswer[]) => {
        // For smart practice, we might just show results locally or save a session
        // For now, let's just exit
        toast({
            title: "Practice Completed",
            description: "Great job! Keep practicing.",
        });
        handleExitQuiz();
    };

    const navigateToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
    };

    if (!isAuthenticated) {
        return <Redirect to="/login" />;
    }

    if (quizStarted && generatedTest) {
        return (
            <NewQuizInterface
                test={generatedTest}
                onExit={handleExitQuiz}
                onSubmit={handleSubmit}
                onProgressUpdate={() => { }} // No progress tracking for now
                navigateToQuestion={navigateToQuestion}
                currentQuestionIndex={currentQuestionIndex}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
                            Smart Practice
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Generate custom practice questions powered by AI. Target your weak areas instantly.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Configure Practice Session</CardTitle>
                            <CardDescription>
                                Select your preferences to generate a custom quiz.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Exam Type</Label>
                                    <Select value={examType} onValueChange={setExamType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cat">CAT</SelectItem>
                                            <SelectItem value="gate">GATE</SelectItem>
                                            <SelectItem value="xat">XAT</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Difficulty</Label>
                                    <Select value={difficulty} onValueChange={setDifficulty}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Easy">Easy</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Select value={subject} onValueChange={setSubject}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {examType === 'cat' ? (
                                            <>
                                                <SelectItem value="Quantitative Aptitude">Quantitative Aptitude</SelectItem>
                                                <SelectItem value="Verbal Ability">Verbal Ability</SelectItem>
                                                <SelectItem value="Data Interpretation">Data Interpretation</SelectItem>
                                            </>
                                        ) : examType === 'xat' ? (
                                            <>
                                                <SelectItem value="Quantitative Aptitude">Quantitative Aptitude</SelectItem>
                                                <SelectItem value="Verbal & Logical Reasoning">Verbal & Logical Reasoning</SelectItem>
                                                <SelectItem value="Decision Making">Decision Making</SelectItem>
                                                <SelectItem value="Essay">Essay</SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                                <SelectItem value="Electronics">Electronics</SelectItem>
                                                <SelectItem value="Mechanical">Mechanical</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Topic</Label>
                                <Input
                                    placeholder="e.g. Algebra, Geometry, Reading Comprehension"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Number of Questions</Label>
                                <Select value={questionCount} onValueChange={setQuestionCount}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 Questions</SelectItem>
                                        <SelectItem value="10">10 Questions</SelectItem>
                                        <SelectItem value="15">15 Questions</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleGenerate}
                                disabled={generateMutation.isPending}
                            >
                                {generateMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating Questions...
                                    </>
                                ) : (
                                    "Start Practice"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <AppFooter />
        </div>
    );
}
