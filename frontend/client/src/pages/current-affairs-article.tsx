import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Link, useRoute } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function CurrentAffairsArticlePage() {
  const [, params] = useRoute("/current-affairs/:articleId");
  const articleId = params?.articleId;
  const queryClient = useQueryClient();
  const [showInsight, setShowInsight] = useState(false);

  const { data: article, isLoading } = useQuery<any>({
    queryKey: [`/api/news/articles/${articleId}/`],
    enabled: !!articleId,
  });

  const { mutate: analyzeArticle, isPending: isAnalyzing } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/news/articles/${articleId}/analyze/`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to analyze article");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/news/articles/${articleId}/`] });
      setShowInsight(true);
    }
  });

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Link href="/current-affairs">
            <Button variant="outline" className="mb-6">← Back to Current Affairs</Button>
          </Link>
          
          {isLoading ? (
             <div className="flex justify-center p-12">
               <Loader2 className="w-8 h-8 animate-spin text-primary" />
             </div>
          ) : article ? (
            <>
              <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
              <div className="text-muted-foreground mb-8">
                {article.source} • {article.date ? format(new Date(article.date), 'MMMM dd, yyyy') : 'Recent'} {article.author ? `• By ${article.author}` : ''}
              </div>
              
              <div className="prose max-w-none text-foreground leading-relaxed preserve-whitespace mb-12">
                {/* Fallback to summary if content is not available */}
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {article.content || article.summary || ""}
                </ReactMarkdown>
              </div>

              {article.summary && showInsight ? (
                <div className="bg-secondary/50 p-6 rounded-lg mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">AI Summary & Takeaways</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowInsight(false)}>Hide</Button>
                  </div>
                  <div className="prose max-w-none">
                     <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                       {article.summary}
                     </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="bg-secondary/20 p-6 rounded-lg mb-8 text-center border border-dashed border-primary/20">
                   <h3 className="text-xl font-bold mb-4">AI Analysis</h3>
                   <p className="text-muted-foreground mb-4">You can dynamically generate Study Notes, MCQs, and detailed Mains Q&A for this article using our AI Assistant.</p>
                   
                   {article.summary ? (
                     <Button onClick={() => setShowInsight(true)}>
                       Show AI Analysis
                     </Button>
                   ) : (
                     <Button onClick={() => analyzeArticle()} disabled={isAnalyzing}>
                         {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                         {isAnalyzing ? "Analyzing..." : "Generate AI Analysis"}
                     </Button>
                   )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
