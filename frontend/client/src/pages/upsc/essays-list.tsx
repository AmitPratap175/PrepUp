import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Star, CheckCircle2, ChevronRight, PenTool } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Essay {
  id: string;
  number: number;
  title: string;
  content: string;
  start_page: number;
}

export default function EssaysListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [starred, setStarred] = useState<string[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    // Load local storage states
    try {
      const savedStarred = localStorage.getItem('upsc_starred_essays');
      if (savedStarred) setStarred(JSON.parse(savedStarred));
      
      const savedCompleted = localStorage.getItem('upsc_completed_essays');
      if (savedCompleted) setCompleted(JSON.parse(savedCompleted));
    } catch (e) {
      console.error("Failed to load local storage", e);
    }

    // Fetch essays
    fetch('/data/151_essays.json')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(data => {
        setEssays(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast({ title: "Error", description: "Could not load essays data.", variant: "destructive" });
        setLoading(false);
      });
  }, []);

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setStarred(prev => {
      const newStarred = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('upsc_starred_essays', JSON.stringify(newStarred));
      return newStarred;
    });
  };

  const toRoman = (num: number) => {
    // Basic approximation since we just have categories or we just use Essay #
    return `Essay ${num}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">151 Essays for UPSC</h1>
              <p className="text-xl text-muted-foreground">
                Master your essay writing with these comprehensive topics.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                <BookOpen className="w-4 h-4 mr-2 inline" />
                {essays.length} Topics
              </Badge>
              <Badge variant="secondary" className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                <CheckCircle2 className="w-4 h-4 mr-2 inline" />
                {completed.length} Completed
              </Badge>
              <Badge variant="secondary" className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                <Star className="w-4 h-4 mr-2 inline fill-yellow-600 dark:fill-yellow-500" />
                {starred.length} Starred
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {essays.map((essay) => {
              const isStarred = starred.includes(essay.id);
              const isCompleted = completed.includes(essay.id);

              return (
                <Card 
                  key={essay.id} 
                  className={`group cursor-pointer relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full border-t-4 ${isCompleted ? 'border-t-green-500 bg-green-50/10' : 'border-t-primary/20 hover:border-t-primary'}`}
                  onClick={() => setLocation(`/upsc/essays/${essay.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="mb-2">
                        {toRoman(essay.number)}
                      </Badge>
                      <button 
                        onClick={(e) => toggleStar(e, essay.id)}
                        className={`p-1.5 rounded-full transition-colors hover:bg-muted ${isStarred ? 'text-yellow-500' : 'text-muted-foreground'}`}
                      >
                        <Star className={`w-5 h-5 ${isStarred ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <CardTitle className="text-lg leading-tight line-clamp-2" title={essay.title}>
                      {essay.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4 flex items-center justify-between">
                    {isCompleted ? (
                      <span className="text-green-600 dark:text-green-400 font-medium flex items-center text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Read
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm font-medium flex items-center group-hover:text-primary transition-colors">
                        Read Essay <ChevronRight className="w-4 h-4 ml-1" />
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
