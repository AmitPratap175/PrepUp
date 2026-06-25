import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { SRSFlashcard, FlashcardData } from "@/components/SRSFlashcard";
import { Loader2, CalendarCheck, ArrowRight, Brain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Revision {
  id: string;
  question_id: string;
  subject: string;
  flashcard: FlashcardData;
  next_review_date: string;
}

export default function DailyRevision() {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchRevisions();
  }, []);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/revisions/due/");
      const data = await res.json();
      setRevisions(data.revisions || []);
    } catch (error) {
      console.error("Failed to fetch revisions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (difficulty: "hard" | "good" | "easy") => {
    const currentRev = revisions[currentIndex];
    
    // Optimistically move to next
    if (currentIndex < revisions.length) {
      setCurrentIndex(prev => prev + 1);
    }
    
    try {
      await apiRequest("POST", `/api/revisions/${currentRev.id}/review/`, {
        difficulty
      });
    } catch (error) {
      console.error("Failed to submit review", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isComplete = currentIndex >= revisions.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-500" />
            Daily Revisions
          </h1>
          <p className="text-slate-500 mt-2">
            Review your AI-generated flashcards based on past mistakes.
          </p>
        </div>
        
        {!isComplete && revisions.length > 0 && (
          <div className="bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 flex items-center gap-2">
            <span className="text-sm font-semibold text-indigo-800">Progress:</span>
            <span className="text-sm font-medium text-indigo-600">{currentIndex + 1} / {revisions.length}</span>
          </div>
        )}
      </div>

      {revisions.length === 0 ? (
        <Card className="p-12 text-center bg-slate-50 border-dashed">
          <CalendarCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-700 mb-2">You're all caught up!</h2>
          <p className="text-slate-500">No flashcards are due for review today. Keep practicing mock tests to generate more.</p>
        </Card>
      ) : isComplete ? (
        <Card className="p-12 text-center bg-green-50 border-green-200">
          <CalendarCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-green-800 mb-2">Revision Session Complete!</h2>
          <p className="text-green-600 mb-8">You've successfully reviewed {revisions.length} concepts today.</p>
          <Button onClick={() => window.location.href = '/dashboard'} className="bg-green-600 hover:bg-green-700">
            Return to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      ) : (
        <div className="transition-all duration-300 ease-in-out">
          <SRSFlashcard 
            key={revisions[currentIndex].id} // Force remount for animation reset
            data={revisions[currentIndex].flashcard} 
            onReview={handleReview} 
          />
        </div>
      )}
    </div>
  );
}
