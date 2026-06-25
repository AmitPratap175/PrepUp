import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, RotateCw, ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";

export interface FlashcardData {
  front: string;
  back: string;
  mnemonic: string;
  explanation: string;
}

interface SRSFlashcardProps {
  data: FlashcardData;
  onReview: (difficulty: "hard" | "good" | "easy") => void;
}

export function SRSFlashcard({ data, onReview }: SRSFlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <div 
        className={`relative w-full transition-transform duration-500 transform-style-3d cursor-pointer min-h-[400px] ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front of the card */}
        <Card 
          className="absolute w-full h-full backface-hidden flex flex-col justify-center items-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200 shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => setIsFlipped(true)}
        >
          <Brain className="w-12 h-12 text-indigo-400 mb-6 opacity-50" />
          <h3 className="text-2xl font-bold text-center text-slate-800 leading-tight">
            {data.front}
          </h3>
          <p className="text-slate-500 mt-8 flex items-center gap-2">
            <RotateCw className="w-4 h-4" />
            Click to reveal answer
          </p>
        </Card>

        {/* Back of the card */}
        <Card 
          className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col p-8 bg-white border-green-200 shadow-xl overflow-y-auto"
        >
          <div className="flex-grow flex flex-col justify-center">
            <div className="mb-6 pb-6 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2 block">Answer</span>
              <p className="text-xl font-medium text-slate-800">{data.back}</p>
            </div>

            <div className="mb-6 bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-yellow-700 mb-1 flex items-center gap-1">
                <Brain className="w-3 h-3" /> Mnemonic
              </span>
              <p className="text-yellow-900 italic font-medium">{data.mnemonic}</p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Explanation</span>
              <p className="text-slate-600 text-sm leading-relaxed">{data.explanation}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center gap-4">
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex-1"
              onClick={(e) => { e.stopPropagation(); onReview("hard"); setIsFlipped(false); }}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Hard
            </Button>
            <Button 
              variant="outline" 
              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex-1"
              onClick={(e) => { e.stopPropagation(); onReview("good"); setIsFlipped(false); }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Good
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
              onClick={(e) => { e.stopPropagation(); onReview("easy"); setIsFlipped(false); }}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Easy
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
