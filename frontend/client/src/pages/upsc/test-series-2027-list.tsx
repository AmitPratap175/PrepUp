import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BookOpen, Clock, FileText, ChevronRight, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'motion/react';

interface Test2027 {
    id: string;
    title: string;
    subject: string;
    duration: number;
}

const UPSC2027TestSeriesList: React.FC = () => {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [tests, setTests] = useState<Test2027[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTests();
    }, []);

    const { data: revisions } = useQuery<any[]>({
        queryKey: ["/api/revision/?subject=UPSC 2027 Prelims"],
        queryFn: async () => {
            const response = await fetch(`/api/revision/?subject=UPSC 2027 Prelims`, {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (!response.ok) return [];
            return response.json();
        }
    });

    const fetchTests = async () => {
        try {
            const response = await fetch('/api/upsc/2027-tests/', {
                headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTests(data);
            } else {
                throw new Error('Failed to fetch tests');
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load the 2027 test series.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                    <p className="text-muted-foreground font-medium animate-pulse">Loading Test Series...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg">
                                <BookOpen size={20} />
                            </div>
                            UPSC 2027 Test Series
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Master your prelims with these comprehensive mock tests.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => setLocation('/upsc')}>
                        Back to Hub
                    </Button>
                </div>

                <Tabs defaultValue="tests" className="w-full">
                    <TabsList className="mb-8">
                        <TabsTrigger value="tests">Test Series</TabsTrigger>
                        <TabsTrigger value="revision">Spaced Revision</TabsTrigger>
                    </TabsList>

                    <TabsContent value="revision">
                        {revisions && revisions.length > 0 ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <Card className="bg-blue-500/5 border-blue-500/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Brain className="h-5 w-5 text-blue-500" />
                                            Smart Revision (2027 Tests)
                                        </CardTitle>
                                        <CardDescription>Personalized review sessions based on your test mistakes.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-3xl font-bold">{revisions.length}</p>
                                                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                                            </div>
                                            <Button size="sm" onClick={() => setLocation('/upsc/revision?subject=UPSC%202027%20Prelims')}>
                                                Review Now
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm">
                                <Brain className="mx-auto h-12 w-12 text-green-500 opacity-80 mb-4" />
                                <h3 className="text-xl font-bold">All caught up!</h3>
                                <p className="text-muted-foreground mt-2">You don't have any pending revisions for your mock tests.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="tests">
                        {tests.length === 0 ? (
                            <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                                <h3 className="text-xl font-bold">No Tests Available</h3>
                                <p className="text-muted-foreground mt-2">Check back later or run the scraper script to download tests.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tests.map((test, index) => (
                                    <motion.div
                                        key={test.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className="hover:shadow-lg transition-all duration-300 border-primary/10 overflow-hidden group cursor-pointer h-full flex flex-col"
                                              onClick={() => setLocation(`/upsc/2027-tests/${test.id}`)}>
                                            <div className="h-2 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                            <CardHeader className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                                        {test.subject}
                                                    </span>
                                                    <div className="flex items-center text-xs text-muted-foreground font-medium gap-1 bg-muted px-2 py-1 rounded-md">
                                                        <Clock size={14} />
                                                        {test.duration} mins
                                                    </div>
                                                </div>
                                                <CardTitle className="text-xl font-bold leading-tight line-clamp-2">
                                                    {test.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardFooter className="pt-4 border-t border-border/50 mt-auto">
                                                <Button variant="ghost" className="w-full justify-between group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                                    Start Test
                                                    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default UPSC2027TestSeriesList;
