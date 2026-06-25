import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw, Calendar as CalendarIcon, Star, Download } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface QuizQuestion {
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
}

interface PIBRelease {
    id: string;
    title: string;
    ministry: string;
    date: string;
    summary: string;
    quiz_data: QuizQuestion[];
    mains_questions?: { question: string; answer: string; }[];
    tags?: string[];
}

export default function PIBListPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTag, setSelectedTag] = useState<string>("All");

    const { data: availableDates, isLoading: isLoadingDates } = useQuery<string[]>({
        queryKey: ["pib-dates"],
        queryFn: async () => {
            const res = await fetch("/api/pib/dates/");
            if (!res.ok) throw new Error("Failed to fetch dates");
            return res.json();
        },
    });

    useEffect(() => {
        if (availableDates && availableDates.length > 0 && !selectedDate) {
            setSelectedDate(availableDates[0]);
        }
    }, [availableDates, selectedDate]);

    const { data: releases, isLoading: isLoadingReleases } = useQuery<PIBRelease[]>({
        queryKey: ["pib-releases", selectedDate],
        queryFn: async () => {
            if (!selectedDate) return [];
            const res = await fetch(`/api/pib/releases/?date=${selectedDate}`);
            if (!res.ok) throw new Error("Failed to fetch releases");
            const data = await res.json();
            return Array.isArray(data) ? data : data.results;
        },
        enabled: !!selectedDate,
    });

    const { data: allReleases, isLoading: isLoadingAllReleases } = useQuery<PIBRelease[]>({
        queryKey: ["pib-releases-all"],
        queryFn: async () => {
            const res = await fetch(`/api/pib/releases/`);
            if (!res.ok) throw new Error("Failed to fetch releases");
            const data = await res.json();
            return Array.isArray(data) ? data : data.results;
        },
    });

    const scrapeMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch("/api/pib/scrape/", { 
                method: "POST",
                headers: { 'Authorization': `Token ${token}` }
            });
            if (!res.ok) throw new Error("Scrape failed");
            return res.json();
        },
        onSuccess: (data) => {
            toast({ title: "Scrape Successful", description: `Found ${data.count} new releases.` });
            queryClient.invalidateQueries({ queryKey: ["pib-releases"] });
        },
        onError: (error) => {
            toast({ title: "Scrape Failed", description: error.message, variant: "destructive" });
        },
    });

    const { data: bookmarks = [], isLoading: isLoadingBookmarks } = useQuery<string[]>({
        queryKey: ["pib-bookmarks"],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            if (!token) return [];
            const res = await fetch("/api/pib/bookmarks/", {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch bookmarks");
            return res.json();
        },
    });

    const toggleBookmark = useMutation({
        mutationFn: async (prid: string) => {
            const token = localStorage.getItem('token');
            const res = await fetch("/api/pib/bookmarks/", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ prid }),
            });
            if (!res.ok) throw new Error("Failed to toggle bookmark");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pib-bookmarks"] });
        },
        onError: (error) => {
            toast({ title: "Bookmark Failed", description: error.message, variant: "destructive" });
        },
    });

    const bookmarkedReleases = allReleases?.filter(r => bookmarks.includes(r.id)) || [];

    const bookmarksByDate = bookmarkedReleases.reduce((acc, r) => {
        const dateStr = r.date || 'Unknown Date';
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(r);
        return acc;
    }, {} as Record<string, PIBRelease[]>);

    const sortedBookmarkDates = Object.keys(bookmarksByDate).sort((a, b) => {
        if (a === 'Unknown Date') return 1;
        if (b === 'Unknown Date') return -1;
        return new Date(b).getTime() - new Date(a).getTime();
    });

    const uniqueTags = Array.from(new Set(releases?.flatMap(r => r.tags || []) || [])).sort();
    
    const filteredReleases = releases?.filter(r => 
        selectedTag === "All" ? true : (r.tags && r.tags.includes(selectedTag))
    );

    const renderReleaseCard = (release: PIBRelease) => {
        const isBookmarked = bookmarks.includes(release.id);
        return (
            <Card key={release.id} className="hover:bg-muted/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full border-primary/10 relative">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`absolute top-4 right-4 z-10 transition-colors ${isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-yellow-500'}`}
                    onClick={(e) => { e.preventDefault(); toggleBookmark.mutate(release.id); }}
                    disabled={toggleBookmark.isPending}
                >
                    <Star className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </Button>
                <CardHeader className="flex-none">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2 pr-8">
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-md">
                                    {release.ministry || "Ministry of Information & Broadcasting"}
                                </span>
                                {release.tags?.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold rounded-md">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <Link href={`/upsc/pib/${release.id}`}>
                                <a className="block mt-2">
                                    <CardTitle className="text-xl cursor-pointer hover:text-primary hover:underline leading-tight line-clamp-3">
                                        {release.title}
                                    </CardTitle>
                                </a>
                            </Link>
                            <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                                <CalendarIcon className="h-3 w-3" />
                                {release.date ? format(new Date(release.date), "PPP") : "No date"}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="line-clamp-4 text-sm text-muted-foreground leading-relaxed">
                        {release.summary || "No summary available."}
                    </p>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="print:hidden">
                <AppHeader />
                <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">PIB Releases</h1>
                        <p className="text-muted-foreground">Latest Press Information Bureau releases with AI summaries.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {!isLoadingDates && availableDates && availableDates.length > 0 && (
                            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                                <CalendarIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                                <select 
                                    className="bg-transparent border-none text-sm font-medium py-1.5 pr-8 pl-2 focus:ring-0 cursor-pointer"
                                    value={selectedDate || ''}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                >
                                    {availableDates.map(date => (
                                        <option key={date} value={date}>
                                            {format(parseISO(date), "PPP")}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {uniqueTags.length > 0 && (
                            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                                <select 
                                    className="bg-transparent border-none text-sm font-medium py-1.5 pr-8 pl-2 focus:ring-0 cursor-pointer"
                                    value={selectedTag}
                                    onChange={(e) => setSelectedTag(e.target.value)}
                                >
                                    <option value="All">All Subjects</option>
                                    {uniqueTags.map(tag => (
                                        <option key={tag} value={tag}>{tag}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <Button
                            onClick={() => scrapeMutation.mutate()}
                            disabled={scrapeMutation.isPending}
                            className="flex items-center gap-2"
                        >
                            {scrapeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Scrape New
                        </Button>
                    </div>
                </div>

                {isLoadingReleases || isLoadingDates || isLoadingBookmarks || isLoadingAllReleases ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="mb-6 grid w-[400px] grid-cols-2">
                            <TabsTrigger value="all">All Releases</TabsTrigger>
                            <TabsTrigger value="bookmarks">
                                Bookmarks {bookmarks.length > 0 && `(${bookmarkedReleases.length})`}
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="all" className="m-0">
                            {filteredReleases?.length === 0 ? (
                                <div className="text-center p-12 text-muted-foreground">No releases found.</div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredReleases?.map(renderReleaseCard)}
                                </div>
                            )}
                        </TabsContent>
                        
                        <TabsContent value="bookmarks" className="m-0">
                            {bookmarkedReleases.length === 0 ? (
                                <div className="text-center p-12 bg-muted/30 rounded-lg border border-dashed">
                                    <Star className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium mb-1">No bookmarks yet</h3>
                                    <p className="text-muted-foreground">Click the star icon on any release to save it here for later review.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                                        <h2 className="text-xl font-semibold">Saved Bookmarks</h2>
                                        <Button onClick={() => window.print()} variant="outline" className="gap-2">
                                            <Download className="h-4 w-4" /> Export to PDF
                                        </Button>
                                    </div>
                                    <div className="space-y-12">
                                        {sortedBookmarkDates.map(date => (
                                            <div key={date}>
                                                <h3 className="text-xl font-bold mb-4 text-primary/80">
                                                    {date !== 'Unknown Date' ? format(parseISO(date), "PPP") : date}
                                                </h3>
                                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                    {bookmarksByDate[date].map(renderReleaseCard)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
                </main>
            </div>

            {/* PRINT ONLY SECTION FOR PDF EXPORT */}
            <div className="hidden print:block text-black bg-white p-8">
                <h1 className="text-3xl font-bold mb-8 text-center border-b pb-4">PrepUp - Bookmarked PIB Summaries</h1>
                
                {bookmarkedReleases.map((release, idx) => (
                    <div key={`print-${release.id}`} className="mb-12" style={{ pageBreakInside: 'avoid' }}>
                        <h2 className="text-2xl font-bold mb-2">{idx + 1}. {release.title}</h2>
                        <p className="text-sm text-gray-500 mb-4 font-semibold">
                            {release.ministry} • {release.date ? format(new Date(release.date), "PPP") : 'No Date'}
                        </p>
                        <div className="prose max-w-none text-sm leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.summary || "No summary available."}</ReactMarkdown>
                        </div>
                        <hr className="mt-8 border-gray-200" />
                    </div>
                ))}

                <div style={{ pageBreakBefore: 'always' }}>
                    <h1 className="text-3xl font-bold mb-8 text-center border-b pb-4">Quiz Questions</h1>
                    {bookmarkedReleases.filter(r => r.quiz_data && r.quiz_data.length > 0).map(release => (
                        <div key={`quiz-${release.id}`} className="mb-8">
                            <h3 className="text-xl font-bold mb-4 bg-gray-100 p-2 rounded">{release.title}</h3>
                            {release.quiz_data.map((q, idx) => (
                                <div key={idx} className="mb-6 ml-4" style={{ pageBreakInside: 'avoid' }}>
                                    <p className="font-semibold text-base mb-2">Q{idx + 1}. {q.question}</p>
                                    <ul className="list-disc pl-6 mb-3 text-sm">
                                        {q.options.map((opt, i) => <li key={i} className="mb-1">{opt}</li>)}
                                    </ul>
                                    <div className="bg-green-50 p-3 rounded border border-green-100">
                                        <p className="text-sm font-bold text-green-800">Answer: {q.correct_answer}</p>
                                        <p className="text-sm text-gray-700 mt-1"><em>Explanation:</em> {q.explanation}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div style={{ pageBreakBefore: 'always' }}>
                    <h1 className="text-3xl font-bold mb-8 text-center border-b pb-4">Mains Practice Questions</h1>
                    {bookmarkedReleases.filter(r => r.mains_questions && r.mains_questions.length > 0).map(release => (
                        <div key={`mains-${release.id}`} className="mb-10">
                            <h3 className="text-xl font-bold mb-6 bg-gray-100 p-2 rounded">{release.title}</h3>
                            {release.mains_questions!.map((mq, idx) => (
                                <div key={idx} className="mb-8 ml-4" style={{ pageBreakInside: 'avoid' }}>
                                    <p className="font-bold text-lg mb-4 text-blue-900">Q{idx + 1}. {mq.question}</p>
                                    <div className="bg-blue-50/50 p-4 rounded border border-blue-100">
                                        <p className="text-sm font-bold text-blue-800 mb-2">Model Approach:</p>
                                        <div className="prose max-w-none text-sm text-gray-800">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{mq.answer}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
