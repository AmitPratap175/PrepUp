import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface PIBRelease {
    id: string;
    title: string;
    ministry: string;
    date: string;
    summary: string;
}

export default function PIBListPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: releases, isLoading } = useQuery<PIBRelease[]>({
        queryKey: ["pib-releases"],
        queryFn: async () => {
            const res = await fetch("/api/pib/releases/");
            if (!res.ok) throw new Error("Failed to fetch releases");
            const data = await res.json();
            return Array.isArray(data) ? data : data.results;
        },
    });

    const scrapeMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/pib/scrape/", { method: "POST" });
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

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <AppHeader />
            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">PIB Releases</h1>
                        <p className="text-muted-foreground">Latest Press Information Bureau releases with AI summaries.</p>
                    </div>
                    <Button
                        onClick={() => scrapeMutation.mutate()}
                        disabled={scrapeMutation.isPending}
                        className="flex items-center gap-2"
                    >
                        {scrapeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Scrape New
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : releases?.length === 0 ? (
                    <div className="text-center p-12 text-muted-foreground">No releases found. Try scraping!</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-1">
                        {releases?.map((release) => (
                            <Card key={release.id} className="hover:bg-muted/50 transition-colors">
                                <CardHeader>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <Link href={`/upsc/pib/${release.id}`}>
                                                <a className="block">
                                                    <CardTitle className="text-xl cursor-pointer hover:text-primary hover:underline">
                                                        {release.title}
                                                    </CardTitle>
                                                </a>
                                            </Link>
                                            <CardDescription>{release.ministry} • {release.date ? format(new Date(release.date), "PPP") : "No date"}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {release.summary || "No summary available."}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
