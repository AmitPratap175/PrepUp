import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function CurrentAffairsPage() {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useQuery<any>({
    queryKey: ["/api/news/articles/"],
  });

  const { mutate: scrapeNews, isPending: isScraping } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/news/scrape/", { method: "POST" });
      if (!res.ok) throw new Error("Failed to scrape news");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news/articles/"] });
    }
  });

  const articles = response?.results || response || [];

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-4">Current Affairs</h1>
              <p className="text-muted-foreground">
                Read latest news and updates specifically curated for UPSC preparation.
              </p>
            </div>
            <Button onClick={() => scrapeNews()} disabled={isScraping} className="flex items-center gap-2">
              {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isScraping ? "Fetching..." : "Fetch Latest News"}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : articles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article: any) => (
                <Link key={article.id} href={`/current-affairs/${article.id}`}>
                  <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                      <CardDescription>
                        {article.source} • {article.date ? format(new Date(article.date), 'MMM dd, yyyy') : 'Recent'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.content ? article.content.substring(0, 200) + "..." : "Click to read more"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
             <div className="text-center py-12">
               <p className="text-muted-foreground">No current affairs articles found. Try running the scraper!</p>
             </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}