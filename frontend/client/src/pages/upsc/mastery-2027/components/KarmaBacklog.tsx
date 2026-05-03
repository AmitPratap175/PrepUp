import React from 'react';
import { useUPSC } from '../UPSCContext';
import { Sparkles, Trash2, CheckCircle, RefreshCcw, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const KarmaBacklog: React.FC = () => {
  const { state, removeUnachievedGoal, generateMakeupPlan, isGeneratingPlan, makeupPlan } = useUPSC();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Karma Backlog</h2>
          <p className="text-slate-500">Address your unachieved goals with AI precision.</p>
        </div>
        <button 
          onClick={generateMakeupPlan}
          disabled={isGeneratingPlan || state.unachievedGoals.length === 0}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/40"
        >
          {isGeneratingPlan ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
          {isGeneratingPlan ? "Consulting Mentor..." : "Generate Makeup Plan"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Goals List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Unachieved Goals</h3>
          {state.unachievedGoals.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <CheckCircle className="mx-auto text-emerald-400 mb-2" size={32} />
                <p className="text-slate-400 text-sm italic">"All karmas cleared. Your slate is clean."</p>
            </div>
          ) : (
            state.unachievedGoals.map((task) => (
              <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-slate-800 whitespace-pre-line">{task.title.replace(/\\n/g, '\n')}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Missed on block starting at {task.startTime}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] font-bold">
                    {task.subject}
                  </span>
                </div>
                <button 
                  onClick={() => removeUnachievedGoal(task.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* AI Plan View */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Mentor Guidance</h3>
          <div className={cn(
            "bg-white p-6 rounded-2xl border border-slate-200 min-h-[400px] shadow-sm",
            !makeupPlan && "flex items-center justify-center text-center text-slate-300 italic text-sm"
          )}>
            {makeupPlan ? (
              <div className="prose prose-slate prose-sm max-w-none">
                <Markdown>{makeupPlan}</Markdown>
              </div>
            ) : (
              <div>
                <Sparkles size={48} className="mx-auto mb-4 opacity-10" />
                <p>Click "Generate Makeup Plan" to let the AI organize your comeback.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
