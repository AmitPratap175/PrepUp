import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, PenTool } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Essay {
  id: string;
  number: number;
  title: string;
  content: string;
  start_page: number;
}

export default function EssayDailyReadPage() {
  const [, params] = useRoute("/upsc/essays/:id");
  const id = params?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [essay, setEssay] = useState<Essay | null>(null);
  const [allEssays, setAllEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedCompleted = localStorage.getItem('upsc_completed_essays');
      if (savedCompleted) setCompleted(JSON.parse(savedCompleted));
    } catch (e) {
      console.error(e);
    }

    fetch('/data/151_essays.json')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: Essay[]) => {
        setAllEssays(data);
        const found = data.find(e => e.id === id);
        if (found) {
          setEssay(found);
        } else {
          toast({ title: "Not Found", description: "Essay not found.", variant: "destructive" });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast({ title: "Error", description: "Could not load essays data.", variant: "destructive" });
        setLoading(false);
      });
  }, [id]);

  const toggleCompletion = () => {
    if (!id) return;
    setCompleted(prev => {
      const isCompleted = prev.includes(id);
      const newCompleted = isCompleted ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('upsc_completed_essays', JSON.stringify(newCompleted));
      if (!isCompleted) {
        toast({ title: "Marked Complete", description: "Great job completing this reading!", variant: "default" });
      }
      return newCompleted;
    });
  };

  const isCompleted = essay && completed.includes(essay.id);

  // Determine prev/next logic
  let prevEssay: Essay | null = null;
  let nextEssay: Essay | null = null;
  if (essay && allEssays.length > 0) {
    const currentIndex = allEssays.findIndex(e => e.id === essay.id);
    if (currentIndex > 0) {
      prevEssay = allEssays[currentIndex - 1];
    }
    if (currentIndex < allEssays.length - 1) {
      nextEssay = allEssays[currentIndex + 1];
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!essay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
        <h2 className="text-2xl font-bold mb-4">Essay Not Found</h2>
        <Button onClick={() => setLocation("/upsc/essays")}>Back to Essays</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center w-full">
            <Button variant="ghost" onClick={() => setLocation("/upsc/essays")} className="pl-0 hover:bg-transparent text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={!prevEssay}
                onClick={() => prevEssay && setLocation(`/upsc/essays/${prevEssay.id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={!nextEssay}
                onClick={() => nextEssay && setLocation(`/upsc/essays/${nextEssay.id}`)}
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-primary font-bold mb-1 uppercase tracking-wider">Essay {essay.number}</p>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">{essay.title}</h1>
            </div>
            
            <div className="flex shrink-0 gap-3">
              <Button 
                variant={isCompleted ? "secondary" : "default"} 
                className={isCompleted ? "text-green-600 dark:text-green-400 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40" : ""}
                onClick={toggleCompletion}
              >
                {isCompleted ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Completed</>
                ) : (
                  "Mark as Complete"
                )}
              </Button>
              <Button 
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                onClick={() => {
                  try {
                    localStorage.setItem('mains_answer_active_tab', '151_essays');
                  } catch (e) {}
                  setLocation("/mains-answer");
                }}
              >
                <PenTool className="w-4 h-4 mr-2" /> Write Answer
              </Button>
            </div>
          </div>

          <Card className="mt-8 overflow-hidden border-border/50">
            <CardContent className="p-6 md:p-10 bg-card">
              <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary/80">
                {/* The extracted PDF text might have newlines that break sentences. We can replace single newlines with spaces but preserve double newlines */}
                <ReactMarkdown>{essay.content.replace(/([^\n])\n([^\n])/g, '$1 $2')}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
