import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Repeat, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLocation } from "wouter";
import { format } from 'date-fns';

interface DailyTarget {
    id: string;
    subject: string;
    date: string;
    isCompleted: boolean;
    isInProgress?: boolean;
    inProgressSessionId?: string | null;
    latestSessionId?: string | null;
    attemptsCount?: number;
    score: number | null;
    totalQuestions: number;
    timePerQuestion: number;
}


interface RevisionItem {
    id: string;
    subject: string;
    nextReviewDate: string;
    interval: number;
}

const DailyTargetsPage: React.FC = () => {
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();

    const { data: targets, isLoading: isLoadingTargets } = useQuery<DailyTarget[]>({
        queryKey: ['daily-targets'],
        queryFn: async () => {
            const response = await fetch('/api/daily-targets/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch daily targets');
            return response.json();
        }
    });

    const { data: revisions, isLoading: isLoadingRevisions } = useQuery<RevisionItem[]>({
        queryKey: ['revisions'],
        queryFn: async () => {
            const response = await fetch('/api/revision/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch revisions');
            return response.json();
        }
    });

    const handleStartTest = (subject: string) => {
        setLocation(`/daily-targets/test/${subject}`);
    };

    const handleResumeTest = (target: DailyTarget) => {
        setLocation(`/daily-targets/test/${encodeURIComponent(target.subject)}`);
    };

    const handleViewResult = (target: DailyTarget) => {
        if (target.latestSessionId) {
            setLocation(`/daily-targets/result/${target.latestSessionId}`);
        } else {
            // Fallback for older targets or if latestSessionId is missing
            setLocation(`/daily-targets/result/${target.id}`);
        }
    };

    const handleRetakeTest = async (subject: string) => {
        if (confirm("Are you sure you want to retake this test? Your previous score will be reset.")) {
            try {
                const response = await fetch(`/api/daily-targets/reset/${subject}/`, {
                    method: 'POST',
                    headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
                });
                if (response.ok) {
                    queryClient.invalidateQueries({ queryKey: ['daily-targets'] });
                    setLocation(`/daily-targets/test/${subject}`);
                } else {
                    alert("Failed to reset test.");
                }
            } catch (error) {
                console.error("Error resetting test:", error);
                alert("An error occurred.");
            }
        }
    };

    const handleStartRevision = () => {
        setLocation(`/daily-targets/revision`);
    };

    return (
        <div className="min-h-screen bg-background">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Calendar className="h-8 w-8 text-primary" />
                            Daily Targets
                        </h1>
                        <p className="text-muted-foreground">Stay consistent and track your progress daily.</p>
                    </div>
                    <Button variant="outline" onClick={() => setLocation('/daily-targets/settings')} className="flex items-center gap-2">
                        <Repeat className="h-4 w-4" /> Settings
                    </Button>
                </div>
                <div className="max-w-4xl mx-auto">

                    <Tabs defaultValue="targets" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="targets">Today's Targets</TabsTrigger>
                            <TabsTrigger value="revision">Revision Queue</TabsTrigger>
                        </TabsList>

                        <TabsContent value="targets" className="space-y-4">
                            {isLoadingTargets ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : targets && targets.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-3">
                                    {targets.map((target) => (
                                        <Card key={target.id} className={`flex flex-col ${target.isCompleted ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="flex justify-between items-start">
                                                    <span>{target.subject}</span>
                                                    {target.isCompleted ? (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Done</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Pending</Badge>
                                                    )}
                                                </CardTitle>
                                                <CardDescription>
                                                    {target.totalQuestions} Questions • {Math.round((target.totalQuestions * target.timePerQuestion) / 60)} Mins
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1 flex flex-col justify-end pt-4 gap-2">
                                                {target.isCompleted ? (
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <div className="text-sm">
                                                            <p className="font-medium flex items-center gap-1 text-green-600 mb-2">
                                                                <CheckCircle2 className="h-4 w-4" /> Completed
                                                            </p>
                                                            <p className="text-muted-foreground">Score: {target.score ?? 0}/{target.totalQuestions}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewResult(target)}>
                                                                Result
                                                            </Button>
                                                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleRetakeTest(target.subject)}>
                                                                Retake
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : target.isInProgress ? (
                                                    <Button className="w-full" onClick={() => handleResumeTest(target)}>
                                                        Resume Test <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button className="w-full" onClick={() => handleStartTest(target.subject)}>
                                                        Start Practice <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="p-8 text-center text-muted-foreground">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                        <p>No targets generated for today. Check your settings or try again later.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* ... (revision tab content) ... */}
                        <TabsContent value="revision" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Repeat className="h-5 w-5 text-primary" />
                                        Spaced Repetition Review
                                    </CardTitle>
                                    <CardDescription>
                                        Review questions you missed previously to strengthen your memory.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingRevisions ? (
                                        <div className="flex justify-center p-4">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        </div>
                                    ) : revisions && revisions.length > 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl font-bold text-primary mb-2">{revisions.length}</div>
                                            <p className="text-muted-foreground mb-6">Questions pending for review today</p>
                                            <Button size="lg" onClick={handleStartRevision}>
                                                Start Revision Session
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                            <p>All caught up! No questions due for revision today.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
            <AppFooter />
        </div>
    );
};

export default DailyTargetsPage;
