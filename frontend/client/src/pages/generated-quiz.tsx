import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useLocation } from "wouter";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";

interface NotebookLMQuizOption {
    text: string;
    isCorrect: boolean;
    rationale: string;
}

interface NotebookLMQuestion {
    id: number;
    question: string;
    answerOptions: NotebookLMQuizOption[];
    hint: string;
}

interface NotebookLMQuizData {
    title: string;
    questions: NotebookLMQuestion[];
}

interface GeneratedQuizResponse {
    source: string;
    generated_at: string;
    notebook_id: string;
    quiz_data: NotebookLMQuizData;
}

export default function QuizGeneratorPage() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [file, setFile] = useState<File | null>(null);
    const [quizData, setQuizData] = useState<GeneratedQuizResponse | null>(null);

    const generateQuizMutation = useMutation({
        mutationFn: async (fileToUpload: File) => {
            const formData = new FormData();
            formData.append("file", fileToUpload);
            const res = await apiRequest("POST", "/api/generate-quiz/", formData);
            return res.json();
        },
        onSuccess: (data: GeneratedQuizResponse) => {
            setQuizData(data);
            toast({
                title: "Success",
                description: "Quiz generated successfully based on your document.",
            });
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to generate quiz. Please try again.",
            });
        },
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setQuizData(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
        },
        multiple: false,
    });

    const handleGenerate = () => {
        if (file) {
            generateQuizMutation.mutate(file);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <AppHeader />
            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">AI Quiz Generator</h1>
                        <p className="text-muted-foreground">
                            Upload a source PDF to generate comprehensive UPSC-style quizzes instantly.
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Document</CardTitle>
                            <CardDescription>
                                Select or drag and drop a PDF file (e.g., NCERT chapter, news analysis).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50"
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-4 rounded-full bg-primary/10 text-primary">
                                        <Upload className="h-8 w-8" />
                                    </div>
                                    {file ? (
                                        <div className="space-y-1">
                                            <p className="font-medium text-foreground">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {isDragActive ? "Drop the file here" : "Drag & drop or click to upload"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Supported format: PDF</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {file && (
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={generateQuizMutation.isPending}
                                        className="w-full sm:w-auto"
                                    >
                                        {generateQuizMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating Questions...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Generate Quiz
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {generateQuizMutation.error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Generation Failed</AlertTitle>
                            <AlertDescription>
                                {generateQuizMutation.error.message || "Something went wrong. ensure the file contains extractable text."}
                            </AlertDescription>
                        </Alert>
                    )}

                    {quizData && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertTitle className="text-green-800 dark:text-green-300">Quiz Generated!</AlertTitle>
                                <AlertDescription className="text-green-700 dark:text-green-400">
                                    Successfully generated {quizData.quiz_data.questions.length} questions from {quizData.source}.
                                </AlertDescription>
                            </Alert>

                            <div className="flex justify-center">
                                <Button size="lg" onClick={() => setLocation(`/generated-quiz/${quizData.notebook_id}`)}>
                                    Start Quiz Now
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
