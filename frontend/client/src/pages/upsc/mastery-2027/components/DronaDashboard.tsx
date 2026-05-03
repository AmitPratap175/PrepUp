import React, { useMemo } from 'react';
import { useUPSC } from '../UPSCContext';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Target, Trophy, AlertCircle, Calendar, Flame } from 'lucide-react';
import { cn } from '../lib/utils';

export const DronaDashboard: React.FC = () => {
  const { state, updateProgress } = useUPSC();
  
  const handleUpdateProgress = (subject: 'math' | 'gs', current: number) => {
    const val = prompt(`Enter new progress % for ${subject === 'math' ? 'Mathematics' : 'GS Phase'} (0-100):`, current.toString());
    if (val !== null) {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        updateProgress(subject, num);
      } else {
        alert("Please enter a valid number between 0 and 100.");
      }
    }
  };
  
  // Heatmap calculation
  const endDate = new Date();
  const startDate = subDays(endDate, 90);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const getHeatColor = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = state.history[dateStr];
    if (!dayData) return 'bg-slate-100';
    
    const completed = dayData.tasks.filter(t => t.completed).length;
    const total = dayData.tasks.length;
    if (total === 0) return 'bg-slate-100';
    
    const ratio = completed / total;
    if (ratio >= 1) return 'bg-blue-600';
    if (ratio > 0.5) return 'bg-blue-400';
    if (ratio > 0) return 'bg-blue-200';
    return 'bg-slate-200';
  };

  const currentStreak = useMemo(() => {
    let streak = 0;
    let checkDate = new Date();
    
    const hasPomodoros = (date: Date) => {
      const ds = format(date, 'yyyy-MM-dd');
      const dayData = state.history[ds];
      if (!dayData) return false;
      return dayData.tasks.some(t => t.pomodorosDone > 0);
    };

    if (!hasPomodoros(checkDate)) {
      checkDate = subDays(checkDate, 1);
    }

    // Safety limit to avoid infinite loops, though subDays wouldn't loop forever, 
    // it's good practice. History shouldn't be larger than a few years.
    while (hasPomodoros(checkDate) && streak < 3650) {
        streak++;
        checkDate = subDays(checkDate, 1);
    }
    return streak;
  }, [state.history]);

  const stats = [
    { label: 'Study Streak', value: `${currentStreak} Days`, icon: <Flame className="text-orange-500" /> },
    { label: 'Math Mastery', value: `${state.mathProgress}%`, icon: <Target className="text-blue-500" /> },
    { label: 'GS Foundation', value: `${state.gsProgress}%`, icon: <Trophy className="text-emerald-500" /> },
    { label: 'Unsolved Backlog', value: state.unachievedGoals.length, icon: <AlertCircle className="text-red-500" /> },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" /> Consistency Mandala
          </h3>
          <div className="flex gap-2 text-[10px] items-center text-slate-400">
            <span>Less</span>
            <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
            <span>More</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 justify-center">
          {dateRange.map((date, i) => (
            <div 
              key={i}
              className={cn(
                "w-4 h-4 rounded-sm flex-shrink-0 transition-all",
                getHeatColor(date)
              )}
              title={format(date, 'MMM do')}
            />
          ))}
        </div>
        <p className="text-center text-slate-400 text-xs mt-4">Last 90 days of dedicated tapasya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Progress Detailed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800">Syllabus Ascension</h3>
          
          <div className="space-y-6">
            <div 
              className="cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors group"
              onClick={() => handleUpdateProgress('math', state.mathProgress)}
              title="Click to update progression"
            >
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Mathematics Optional</span>
                <span className="text-slate-400 font-mono bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{state.mathProgress}%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-lg shadow-blue-200"
                  style={{ width: `${state.mathProgress}%` }}
                />
              </div>
            </div>

            <div 
              className="cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors group"
              onClick={() => handleUpdateProgress('gs', state.gsProgress)}
              title="Click to update progression"
            >
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-slate-600 group-hover:text-emerald-600 transition-colors">GS Phase (Advance)</span>
                <span className="text-slate-400 font-mono bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{state.gsProgress}%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-lg shadow-emerald-200"
                  style={{ width: `${state.gsProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Analysis (Mock data for UI) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[300px]">
            <h3 className="font-bold text-slate-800 mb-6">Execution Velocity</h3>
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={[
                    { day: 'M', poms: 8 },
                    { day: 'T', poms: 9 },
                    { day: 'W', poms: 5 },
                    { day: 'T', poms: 10 },
                    { day: 'F', poms: 12 },
                    { day: 'S', poms: 7 },
                    { day: 'S', poms: 4 },
                ]}>
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="poms" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
