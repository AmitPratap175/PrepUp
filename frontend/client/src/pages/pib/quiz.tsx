import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
}

interface PIBReleaseDetail {
    id: string;
    title: string;
    quiz_data: { quiz: QuizQuestion[] } | QuizQuestion[];
}

export default function PIBQuizPage() {
    const [, params] = useRoute("/upsc/pib/:id/quiz");
    const id = params?.id;
    const [, setLocation] = useLocation();

    const { data: release, isLoading } = useQuery<PIBReleaseDetail>({
        queryKey: ["pib-release", id],
        queryFn: async () => {
            const res = await fetch(`/api/pib/releases/${id}/`);
            if (!res.ok) throw new Error("Failed to fetch release");
            return res.json();
        },
        enabled: !!id,
    });

    const questionData = release?.quiz_data;
    const questions: QuizQuestion[] = questionData ? (Array.isArray(questionData) ? questionData : (questionData.quiz || [])) : [];


    return (
        <div className="min-h-screen bg-background text-foreground">
            <AppHeader />
            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <Link href={`/upsc/pib/${id}`}>
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:underline flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Release
                    </Button>
                </Link>

                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : !release || questions.length === 0 ? (
                    <div className="text-center p-12 text-muted-foreground">
                        No quiz available for this release.
                        <br /><Button className="mt-4" onClick={() => setLocation(`/upsc/pib/${id}`)}>Go Back</Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">Quiz: {release.title}</h1>
                            <p className="text-muted-foreground">{questions.length} Questions</p>
                        </div>
                        <QuizInterface questions={questions} />
                    </div>
                )}
            </main>
        </div>
    );
}

function QuizInterface({ questions }: { questions: QuizQuestion[] }) {
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    const { toast } = useToast();

    const handleAnswer = (qIndex: number, option: string) => {
        setAnswers(prev => ({ ...prev, [qIndex]: option }));
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < questions.length) {
            toast({ title: "Incomplete", description: "Please answer all questions before submitting.", variant: "destructive" });
            return;
        }
        setShowResults(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const score = questions.reduce((acc, q, idx) => {
        return acc + (answers[idx] === q.correct_answer ? 1 : 0);
    }, 0);

    return (
        <div className="space-y-8 pb-12">
            {showResults && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-center text-3xl">Score: {score} / {questions.length}</CardTitle>
                    </CardHeader>
                </Card>
            )}

            {questions.map((q, idx) => {
                const isCorrect = answers[idx] === q.correct_answer;
                const cardClass = showResults
                    ? (isCorrect ? "border-green-500 bg-green-50/10" : "border-red-500 bg-red-50/10")
                    : "";

                return (
                    <Card key={idx} className={cardClass}>
                        <CardContent className="pt-6">
                            <p className="font-medium text-lg mb-4 whitespace-pre-line">{idx + 1}. {q.question}</p>
                            <RadioGroup onValueChange={(val) => !showResults && handleAnswer(idx, val)} value={answers[idx]}>
                                {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-start space-x-3 space-y-1">
                                        <RadioGroupItem value={opt} id={`q${idx}-opt${oIdx}`} className="mt-1" disabled={showResults} />
                                        <Label htmlFor={`q${idx}-opt${oIdx}`} className={`text-base font-normal leading-relaxed cursor-pointer ${showResults ? '' : 'hover:text-primary'}`}>
                                            {opt}
                                            {showResults && opt === q.correct_answer && <span className="ml-2 text-green-600 font-bold">(Correct Answer)</span>}
                                            {showResults && !isCorrect && opt === answers[idx] && <span className="ml-2 text-red-600 font-bold">(Your Answer)</span>}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            {showResults && (
                                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground bg-muted/30 p-4 rounded">
                                    <span className="font-semibold block mb-1">Explanation:</span>
                                    {q.explanation}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            {!showResults ? (
                <Button onClick={handleSubmit} className="w-full text-lg py-6">Submit Quiz</Button>
            ) : (
                <Button onClick={() => { setShowResults(false); setAnswers({}); window.scrollTo({ top: 0, behavior: "smooth" }); }} variant="outline" className="w-full">Retake Quiz</Button>
            )}
        </div>
    );
}
