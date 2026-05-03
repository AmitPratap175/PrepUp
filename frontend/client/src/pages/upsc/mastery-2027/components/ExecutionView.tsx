import React, { useState, useEffect, useRef } from 'react';
import { useUPSC } from '../UPSCContext';
import { format, parse, isWithinInterval, addMinutes, subDays } from 'date-fns';
import { Play, Pause, RotateCcw, CheckCircle2, Circle, Clock, Flame, Brain, Target, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const ExecutionView: React.FC = () => {
  const { state, updateTask, markTaskComplete } = useUPSC();
  const [activeTab, setActiveTab] = useState<'tracker' | 'timer'>('tracker');
  const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const dayData = state.history[viewDate];
  const { initDayIfMissing } = useUPSC();

  useEffect(() => {
    initDayIfMissing(viewDate);
  }, [viewDate, initDayIfMissing]);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(state.settings.pomodoroWork * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentSlotTask, setCurrentSlotTask] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active Slot Detection
  const [activeSlotName, setActiveSlotName] = useState<string | null>(null);
  const [slotTimeLeft, setSlotTimeLeft] = useState<string>("");

  useEffect(() => {
    const checkSlot = () => {
      const now = new Date();
      const timeStr = format(now, 'HH:mm');
      
      let found = false;
      const slots = state.settings.standardSlots;
      
      for (const [key, interval] of Object.entries(slots)) {
          const start = parse(interval.start, 'HH:mm', now);
          const end = parse(interval.end, 'HH:mm', now);
          
          if (isWithinInterval(now, { start, end })) {
              setActiveSlotName(key);
              const diff = Math.floor((end.getTime() - now.getTime()) / 60000);
              const h = Math.floor(diff / 60);
              const m = diff % 60;
              setSlotTimeLeft(`${h}h ${m}m remaining`);
              found = true;
              break;
          }
      }
      if (!found) {
          setActiveSlotName(null);
          setSlotTimeLeft("No active slot");
      }
    };

    checkSlot();
    const interval = setInterval(checkSlot, 60000);
    return () => clearInterval(interval);
  }, [state.settings.standardSlots]);

  const getTaskDuration = (taskId: string | null) => {
    if (!taskId) return state.settings.pomodoroWork;
    const task = dayData?.tasks.find(t => t.id === taskId);
    if (!task) return state.settings.pomodoroWork;
    const [h1, m1] = task.startTime.split(':').map(Number);
    const [h2, m2] = task.endTime.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    const duration = diff > 0 ? diff : state.settings.pomodoroWork;
    return Math.min(duration, state.settings.pomodoroWork); // Limit to 1 Pomodoro
  };

  const handleTaskSelect = (taskId: string) => {
    if (currentSlotTask && currentSlotTask !== taskId) {
      if (!isBreak) {
         const totalSecs = getTaskDuration(currentSlotTask) * 60;
         updateTask(viewDate, currentSlotTask, { elapsedSeconds: totalSecs - timerSeconds });
      }
    }
    setCurrentSlotTask(taskId);
  };

  useEffect(() => {
    if (currentSlotTask) {
      const task = state.history[viewDate]?.tasks.find(t => t.id === currentSlotTask);
      const totalSecs = getTaskDuration(currentSlotTask) * 60;
      const elapsed = task?.elapsedSeconds || 0;
      setTimerSeconds(Math.max(0, totalSecs - elapsed));
      setIsActive(false);
      setIsBreak(false);
    } else {
      setTimerSeconds(state.settings.pomodoroWork * 60);
      setIsActive(false);
      setIsBreak(false);
    }
  }, [currentSlotTask, viewDate]); // Only trigger when task or date changes

  const playSoundCue = (type: 'start' | 'workEnd' | 'breakEnd') => {
    if (!state.settings.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === 'start') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
      } else if (type === 'workEnd') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(880, now); // A5
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.2); // A4
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
          osc.start(now);
          osc.stop(now + 1.0);
      } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(659.25, now + 0.15);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          gain.gain.setValueAtTime(0, now + 0.15);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          
          osc.start(now);
          osc.stop(now + 0.5);
      }
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  // Timer Logic
  const toggleTimer = () => {
    if (!isActive && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    if (!isActive) {
      playSoundCue('start');
    } else {
      // Pausing: Sync exact time to context
      if (!isBreak && currentSlotTask) {
         const totalSecs = getTaskDuration(currentSlotTask) * 60;
         updateTask(viewDate, currentSlotTask, { elapsedSeconds: totalSecs - timerSeconds });
      }
    }
    setIsActive(!isActive);
  };
  const resetTimer = () => {
    setIsActive(false);
    setIsFocusMode(false);
    setIsBreak(false);
    setTimerSeconds(getTaskDuration(currentSlotTask) * 60);
  };

  useEffect(() => {
    if (isActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (isActive && timerSeconds === 0) {
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timerSeconds]);

  // Periodic sync of elapsed time every 5 seconds
  useEffect(() => {
    if (isActive && !isBreak && currentSlotTask) {
      if (timerSeconds > 0 && timerSeconds % 5 === 0) {
        const totalSecs = getTaskDuration(currentSlotTask) * 60;
        updateTask(viewDate, currentSlotTask, { elapsedSeconds: totalSecs - timerSeconds });
      }
    }
  }, [timerSeconds, isActive, isBreak, currentSlotTask, viewDate, updateTask]);

  const sendNotification = (msg: string) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification("PrepUp Focus Timer", {
            body: msg,
            icon: '/vite.svg'
          });
        }).catch(() => {
          new Notification(msg);
        });
      } else {
        new Notification(msg);
      }
    }
  };

  const handleTimerComplete = () => {
    if (!isBreak) {
      // Work session complete
      if (currentSlotTask) {
        const task = dayData?.tasks.find(t => t.id === currentSlotTask);
        if (task) {
          updateTask(viewDate, task.id, { 
             pomodorosDone: task.pomodorosDone + 1,
             elapsedSeconds: 0 // Reset for the next session
          });
        }
      }
      setIsBreak(true);
      setTimerSeconds(state.settings.pomodoroBreak * 60);
      sendNotification(`Focus Phase Complete! Time for a ${state.settings.pomodoroBreak}-minute break.`);
      playSoundCue('workEnd');
    } else {
      // Break session complete
      setIsBreak(false);
      setTimerSeconds(getTaskDuration(currentSlotTask) * 60);
      sendNotification("Break Over! Get ready for your next study session.");
      playSoundCue('breakEnd');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
      const histDay = state.history[dateStr];
      if (!histDay) {
        if (i === 0) continue; // Today having no data doesn't break yesterday's streak
        break;
      }
      const hasActivity = histDay.tasks.some(t => t.completed || t.pomodorosDone > 0);
      if (hasActivity) {
        streak++;
      } else {
        if (i === 0) continue;
        break;
      }
    }
    return streak;
  };

  const streakCount = calculateStreak();

  if (!dayData) return <div>Initializing today...</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4 md:p-6 text-slate-800 h-full">
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-black text-slate-400 flex flex-col items-center justify-center p-6 selection:bg-transparent"
          >
            <div className="flex flex-col items-center justify-center w-full max-w-5xl gap-8">
              <motion.span 
                animate={{ opacity: isBreak ? 0.5 : 1 }}
                className="text-[140px] sm:text-[220px] md:text-[280px] font-extralight tracking-tighter tabular-nums font-mono leading-none text-white/90"
              >
                {formatTime(timerSeconds)}
              </motion.span>
              
              <div className="flex flex-col items-center gap-3 text-center opacity-70">
                 {currentSlotTask ? (
                   <>
                     <h2 className="text-xl md:text-2xl font-light tracking-wide text-white/80 uppercase">
                       {dayData.tasks.find(t => t.id === currentSlotTask)?.subject}
                     </h2>
                     <p className="text-white/50 text-sm md:text-base max-w-md whitespace-pre-line leading-relaxed font-light">
                       {dayData.tasks.find(t => t.id === currentSlotTask)?.title.replace(/\\n/g, '\n')}
                     </p>
                   </>
                 ) : (
                   <span className="text-lg text-white/60 tracking-widest uppercase font-light">General Focus</span>
                 )}
                 <span className={cn(
                    "mt-4 px-4 py-1 rounded-full text-xs font-medium uppercase tracking-widest border transition-colors duration-1000",
                    isBreak ? "border-emerald-500/20 text-emerald-400/80" : "border-white/10 text-white/40",
                    !isActive && "opacity-50"
                  )}>
                  {!isActive ? "PAUSED" : (isBreak ? "Rest Phase" : "Focus Phase")}
                </span>
              </div>
            </div>

            <div className="absolute top-12 left-12 flex opacity-10 hover:opacity-100 transition-opacity duration-500">
               <Brain size={24} className="text-white" />
            </div>

            <div className="absolute bottom-12 flex gap-4 opacity-50 hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={toggleTimer}
                className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all uppercase tracking-widest text-xs font-bold backdrop-blur-md shadow-lg"
              >
                {isActive ? <Pause size={14} /> : <Play size={14} />} {isActive ? "Pause Focus" : "Resume Focus"}
              </button>
              <button 
                onClick={() => { setIsActive(false); setIsFocusMode(false); }}
                className="flex items-center gap-3 px-6 py-3 rounded-full bg-red-500/20 text-red-100 hover:text-white hover:bg-red-500/40 border border-red-500/30 transition-all uppercase tracking-widest text-xs font-bold backdrop-blur-md"
              >
                Exit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-0 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              UPSC 2027 <span className="font-normal text-slate-400">/ PREP TRACKER</span>
            </h1>
            <input 
               type="date"
               value={viewDate}
               onChange={(e) => setViewDate(e.target.value)}
               className="bg-slate-100 border-none rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors"
            />
          </div>
          <p className="text-sm text-slate-500 font-medium">
            {format(parse(viewDate, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM do')}
          </p>
        </div>
        <div className="text-left sm:text-right space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{streakCount} DAY STREAK</p>
          <div className="flex items-center sm:justify-end gap-1.5">
            <Flame className={cn(streakCount > 0 ? "text-orange-500" : "text-slate-300")} size={16} fill="currentColor" />
            <span className={cn("font-bold text-sm", streakCount > 0 ? "text-slate-700" : "text-slate-400")}>
              {streakCount > 0 ? "Active Streak" : "Start a Streak"}
            </span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow content-start">
        <section className="lg:col-span-12">
          <div className="bg-slate-900 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                <BookOpen size={160} />
             </div>
             <div className="flex-1 z-10 relative space-y-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">GS / Core</h3>
                <p className="text-slate-200 text-sm whitespace-pre-line leading-relaxed">
                   {(dayData.tasks.find(t => t.subject.includes('General Studies') && t.startTime < '15:00')?.title || '').replace(/\\n/g, '\n')}
                </p>
             </div>
             <div className="w-px bg-slate-700 hidden md:block"></div>
             <div className="flex-1 z-10 relative space-y-2">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Mathematics</h3>
                <p className="text-slate-200 text-sm whitespace-pre-line leading-relaxed">
                   {(dayData.tasks.find(t => t.subject.includes('Math'))?.title || '').replace(/\\n/g, '\n')}
                </p>
             </div>
             <div className="w-px bg-slate-700 hidden md:block"></div>
             <div className="flex-1 z-10 relative space-y-2">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Evening / Night</h3>
                <div className="text-slate-200 text-sm whitespace-pre-line leading-relaxed space-y-2">
                   {dayData.tasks.filter(t => t.startTime >= '18:00' || t.startTime < '04:00').map(t => (
                       <div key={t.id}><span className="text-purple-300 font-semibold">{t.subject}:</span> {t.title.replace(/\\n/g, '\n')}</div>
                   ))}
                </div>
             </div>
          </div>
        </section>

        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs uppercase tracking-widest font-bold text-slate-400">Active Execution</h2>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                <Clock size={12} /> {activeSlotName || 'Rest Break'}
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              {dayData.tasks.map((task) => (
                <motion.div 
                  layout
                  key={task.id}
                  onClick={() => handleTaskSelect(task.id)}
                  animate={{
                    opacity: task.completed ? 0.8 : 1,
                    scale: task.completed ? 0.99 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "p-4 rounded-r-xl transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between border-l-4 gap-4 sm:gap-0",
                    task.completed ? "border-emerald-500 bg-emerald-50/50" : 
                    currentSlotTask === task.id ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white shadow-sm border border-t-slate-100 border-r-slate-100 border-b-slate-100"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        markTaskComplete(viewDate, task.id);
                      }}
                      className={cn(
                        "mt-0.5 shrink-0 transition-colors",
                        task.completed ? "text-emerald-500" : "text-slate-300 hover:text-slate-400"
                      )}
                    >
                      {task.completed ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        >
                          <CheckCircle2 size={20} fill="currentColor" className="text-white bg-emerald-500 rounded-full" />
                        </motion.div>
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn("text-sm font-bold", task.completed ? "text-slate-400 line-through" : "text-slate-800")}>
                          {task.subject}
                        </h3>
                        {task.needsRevision && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase rounded flex items-center">
                            To-Revise
                          </span>
                        )}
                      </div>
                      <p className={cn("text-xs whitespace-pre-line leading-relaxed", task.completed ? "text-slate-400" : "text-slate-500")}>
                        {task.title.replace(/\\n/g, '\n')}
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-xs font-mono font-semibold text-slate-400 shrink-0 ml-8 sm:ml-0">
                    <span>{task.startTime}-{task.endTime}</span>
                    <span className="flex items-center justify-center gap-1 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100 w-full sm:w-auto">
                        <Target size={10} /> {task.pomodorosDone}/{task.pomodorosRequired}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white flex flex-col justify-center items-center gap-6 relative overflow-hidden h-[340px] sticky top-6">
            <div className="absolute top-[-15%] right-[-10%] p-4 opacity-5 pointer-events-none">
                <Target size={240} />
            </div>
            
            <div className="flex flex-col items-center gap-2 relative z-10 w-full">
              <div className="flex items-center justify-between w-full mb-4 px-2">
                 <span className={cn(
                    "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                    isBreak ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                  )}>
                  {isBreak ? "Rest Phase" : "Focus Phase"}
                </span>
                <button onClick={resetTimer} className="p-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                  <RotateCcw size={14} />
                </button>
              </div>

              <span className="text-7xl font-bold tracking-tighter tabular-nums font-mono">
                {formatTime(timerSeconds)}
              </span>
              <span className="text-sm font-medium text-slate-400 mt-2 text-center px-4 line-clamp-2">
                {currentSlotTask ? dayData.tasks.find(t => t.id === currentSlotTask)?.subject : "Select a task to begin"}
              </span>
            </div>
            
            <button 
              onClick={() => {
                if ("Notification" in window && Notification.permission !== "granted") {
                  Notification.requestPermission();
                }
                if (isActive) {
                   toggleTimer();
                } else {
                   setIsFocusMode(true);
                   setIsActive(true);
                   playSoundCue('start');
                }
              }}
              className={cn(
                  "w-full py-4 rounded-xl font-bold tracking-wide uppercase transition-all shadow-lg text-sm relative z-10",
                  isActive ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white text-slate-900 hover:bg-slate-100 ring-2 ring-white/20 ring-offset-2 ring-offset-slate-900 hover:scale-[1.02]"
              )}
            >
              {isActive ? "PAUSE FOCUS" : "START FOCUS"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
