import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { format, subDays, startOfDay, isAfter, parse, addDays } from 'date-fns';
import { AppState, DayData, INITIAL_SETTINGS, Task, DEFAULT_TASKS } from './lib/utils';
import { getDayData } from './lib/scheduleData';
import { GoogleGenAI } from '@google/genai';
import { apiRequest } from '@/lib/queryClient';

interface UPSCContextType {
  state: AppState;
  updateTask: (date: string, taskId: string, updates: Partial<Task>) => void;
  markTaskComplete: (date: string, taskId: string) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  addUnachievedGoal: (task: Task) => void;
  removeUnachievedGoal: (taskId: string) => void;
  setTasksForDay: (date: string, tasks: Task[]) => void;
  generateMakeupPlan: () => Promise<void>;
  isGeneratingPlan: boolean;
  makeupPlan: string | null;
  initDayIfMissing: (date: string) => void;
  updateProgress: (subject: 'math' | 'gs', value: number) => void;
  isLoaded: boolean;
}

const UPSCContext = createContext<UPSCContextType | undefined>(undefined);

export const UPSCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
      history: {},
      unachievedGoals: [],
      settings: INITIAL_SETTINGS,
      mathProgress: 15,
      gsProgress: 25,
  });
  
  const [isLoaded, setIsLoaded] = useState(false);

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [makeupPlan, setMakeupPlan] = useState<string | null>(null);

  // Fetch initial state from database
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await apiRequest("GET", "/api/upsc/mastery-state/");
        const data = await res.json();
        
        if (data && Object.keys(data).length > 0) {
            const parsed = data;
            if (!parsed.settings) parsed.settings = INITIAL_SETTINGS;
            // Migrate "Current Affairs" -> "General Studies" and split Revision slots
            if (parsed.history) {
                Object.values(parsed.history).forEach((day: any) => {
                    if (day && day.tasks) {
                        day.tasks.forEach((t: any) => {
                            if (t.subject === 'Current Affairs') {
                                t.subject = 'General Studies';
                            }
                            if (t.title === 'Evening GS Foundation' || t.title.includes('Current Affairs')) {
                                 t.title = t.title.replace('Current Affairs', 'General Studies');
                                 if (t.title === 'Evening GS Foundation') t.title = 'Evening General Studies';
                            }
                        });
                        
                        const nightRev = day.tasks.find((t: any) => t.subject === 'Revision' && t.startTime === '22:00' && (t.endTime === '01:30' || t.title === 'Night Revision & Language'));
                        if (nightRev) {
                             nightRev.title = 'Night GS/Revision';
                             nightRev.endTime = '00:30';
                             if (nightRev.pomodorosRequired > 2) nightRev.pomodorosRequired = 2;
                             
                             const hasLang = day.tasks.find((t: any) => t.subject === 'Language' && t.startTime === '00:30');
                             if (!hasLang) {
                                 day.tasks.push({
                                     id: Math.random().toString(36).substr(2, 9),
                                     title: 'Language and Revision',
                                     subject: 'Language',
                                     pomodorosRequired: 1,
                                     pomodorosDone: 0,
                                     completed: false,
                                     startTime: '00:30',
                                     endTime: '01:30',
                                 });
                             }
                        }
                    }
                });
            }
            setState(parsed);
        } else {
            // Fallback to local storage if first time migrating
            const saved = localStorage.getItem('arjun_ai_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (!parsed.settings) parsed.settings = INITIAL_SETTINGS;
                setState(parsed);
            }
        }
      } catch (e) {
        console.error("Failed to fetch state from backend", e);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchState();
  }, []);

  // Persistence (Debounced DB Save & LocalStorage Sync)
  useEffect(() => {
    if (!isLoaded) return;
    
    // Always keep local storage in sync as an offline fallback
    localStorage.setItem('arjun_ai_state', JSON.stringify(state));
    
    const timeoutId = setTimeout(async () => {
      try {
        await apiRequest("PUT", "/api/upsc/mastery-state/", state);
      } catch (e) {
        console.error("Failed to sync state to backend", e);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [state, isLoaded]);

  const initDayIfMissing = useCallback((targetDate: string) => {
    setState(prev => {
        if (prev.history[targetDate]) return prev;
        const schedule = getDayData(targetDate);
        const tasks: Task[] = [
          {
            id: Math.random().toString(36).substr(2, 9),
            title: schedule.gs,
            subject: 'General Studies',
            pomodorosRequired: 5,
            pomodorosDone: 0,
            completed: false,
            startTime: prev.settings.standardSlots.afternoon.start,
            endTime: '14:30',
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            title: schedule.math,
            subject: 'Mathematics',
            pomodorosRequired: 5,
            pomodorosDone: 0,
            completed: false,
            startTime: '14:30',
            endTime: prev.settings.standardSlots.afternoon.end,
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            title: schedule.eve,
            subject: 'General Studies',
            pomodorosRequired: 4,
            pomodorosDone: 0,
            completed: false,
            startTime: prev.settings.standardSlots.evening.start,
            endTime: prev.settings.standardSlots.evening.end,
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            title: schedule.night,
            subject: 'Revision',
            pomodorosRequired: 2,
            pomodorosDone: 0,
            completed: false,
            startTime: prev.settings.standardSlots.night.start,
            endTime: '00:30',
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Language and Revision',
            subject: 'Language',
            pomodorosRequired: 1,
            pomodorosDone: 0,
            completed: false,
            startTime: '00:30',
            endTime: prev.settings.standardSlots.night.end,
          }
        ];
        return {
            ...prev,
            history: {
                ...prev.history,
                [targetDate]: { date: targetDate, tasks, isDayFinished: false }
            }
        };
    });
  }, []);

  // Daily Check for Missed Tasks
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Check if yesterday was processed
    if (state.history[yesterday] && !state.history[yesterday].isDayFinished) {
      const missedTasks = state.history[yesterday].tasks.filter(t => !t.completed);
      if (missedTasks.length > 0) {
        setState(prev => ({
          ...prev,
          unachievedGoals: [...prev.unachievedGoals, ...missedTasks],
          history: {
            ...prev.history,
            [yesterday]: { ...prev.history[yesterday], isDayFinished: true }
          }
        }));
      }
    }

    // Initialize today if not exists
    initDayIfMissing(today);
  }, [state.history, initDayIfMissing]);

  const updateProgress = useCallback((subject: 'math' | 'gs', value: number) => {
    setState(prev => ({
      ...prev,
      [subject === 'math' ? 'mathProgress' : 'gsProgress']: value
    }));
  }, []);

  const updateTask = (date: string, taskId: string, updates: Partial<Task>) => {
    setState(prev => {
      const day = prev.history[date];
      if (!day) return prev;
      
      const newTasks = day.tasks.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      );

      // Auto-complete if pomodoros met
      let finalTasks = newTasks.map(t => {
          if (t.id === taskId && t.pomodorosDone >= t.pomodorosRequired && !t.completed) {
              return { ...t, completed: true };
          }
          return t;
      });

      let nextState = {
        ...prev,
        history: {
          ...prev.history,
          [date]: { ...day, tasks: finalTasks }
        }
      } as AppState; // Type assertion needed for nested complexity

      // Handle Revision Scheduling
      const theTask = finalTasks.find(t => t.id === taskId);
      if (theTask && theTask.completed && !theTask.revisionsScheduled && theTask.subject !== 'Revision') {
          const baseDate = parse(date, 'yyyy-MM-dd', new Date());
          const intervals = [1, 3, 7, 30];
          intervals.forEach(days => {
              const revDateStr = format(addDays(baseDate, days), 'yyyy-MM-dd');
              const revDayData = nextState.history[revDateStr] ? { ...nextState.history[revDateStr] } : { date: revDateStr, tasks: [], isDayFinished: false };
              const revTask: Task = {
                  id: Math.random().toString(36).substring(2, 11),
                  title: `[Rev ${days}D] ${theTask.title}`,
                  subject: 'Revision',
                  completed: false,
                  pomodorosRequired: Math.max(1, Math.floor(theTask.pomodorosRequired / 2)),
                  pomodorosDone: 0,
                  startTime: nextState.settings.standardSlots.night.start,
                  endTime: nextState.settings.standardSlots.night.end,
                  revisionsScheduled: true
              };
              revDayData.tasks = [...revDayData.tasks, revTask];
              nextState.history = { ...nextState.history, [revDateStr]: revDayData };
          });
          finalTasks = finalTasks.map(t => t.id === taskId ? { ...t, revisionsScheduled: true } : t);
          nextState.history[date] = { ...day, tasks: finalTasks };
      }

      return nextState;
    });
  };

  const markTaskComplete = (date: string, taskId: string) => {
    setState(prev => {
        const day = prev.history[date];
        if (!day) return prev;
        let newTasks = day.tasks.map(t => {
            if (t.id === taskId) {
               const completed = !t.completed;
               const needsRevision = completed && (t.subject !== 'Revision' && t.subject !== 'Language');
               return { ...t, completed, pomodorosDone: completed ? t.pomodorosRequired : 0, needsRevision };
            }
            return t;
        });
        let nextState = {
            ...prev,
            history: {
                ...prev.history,
                [date]: { ...day, tasks: newTasks }
            }
        };

        // Handle Revision Scheduling
        const theTask = newTasks.find(t => t.id === taskId);
        if (theTask && theTask.completed && !theTask.revisionsScheduled && theTask.subject !== 'Revision') {
            const baseDate = parse(date, 'yyyy-MM-dd', new Date());
            const intervals = [1, 3, 7, 30];
            intervals.forEach(days => {
                const revDateStr = format(addDays(baseDate, days), 'yyyy-MM-dd');
                const revDayData = nextState.history[revDateStr] ? { ...nextState.history[revDateStr] } : { date: revDateStr, tasks: [], isDayFinished: false };
                const revTask: Task = {
                    id: Math.random().toString(36).substring(2, 11),
                    title: `[Rev ${days}D] ${theTask.title}`,
                    subject: 'Revision',
                    completed: false,
                    pomodorosRequired: Math.max(1, Math.floor(theTask.pomodorosRequired / 2)),
                    pomodorosDone: 0,
                    startTime: nextState.settings.standardSlots.night.start,
                    endTime: nextState.settings.standardSlots.night.end,
                    revisionsScheduled: true
                };
                revDayData.tasks = [...revDayData.tasks, revTask];
                nextState.history = { ...nextState.history, [revDateStr]: revDayData };
            });
            
            newTasks = newTasks.map(t => t.id === taskId ? { ...t, revisionsScheduled: true } : t);
            nextState.history[date] = { ...day, tasks: newTasks };
        }

        return nextState;
    });
  };

  const updateSettings = (newSettings: Partial<AppState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const addUnachievedGoal = (task: Task) => {
    setState(prev => ({
      ...prev,
      unachievedGoals: [...prev.unachievedGoals, task]
    }));
  };

  const removeUnachievedGoal = (taskId: string) => {
    setState(prev => ({
      ...prev,
      unachievedGoals: prev.unachievedGoals.filter(t => t.id !== taskId)
    }));
  };

  const setTasksForDay = (date: string, tasks: Task[]) => {
    setState(prev => {
      const day = prev.history[date] || { date, tasks: [], isDayFinished: false };
      return {
        ...prev,
        history: {
          ...prev.history,
          [date]: { ...day, tasks }
        }
      };
    });
  };

  const generateMakeupPlan = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Please set your GEMINI_API_KEY in the secrets panel.");
      return;
    }

    setIsGeneratingPlan(true);
    setMakeupPlan(null);

    try {
      const genAI = new GoogleGenAI({ apiKey });

      const prompt = `
        As a UPSC Mentor, help me generate a makeup plan.
        Current Unachieved Goals:
        ${state.unachievedGoals.map(g => `- ${g.title} (${g.subject})`).join('\n')}
        
        My current daily schedule blocks:
        - Afternoon: ${state.settings.standardSlots.afternoon.start} to ${state.settings.standardSlots.afternoon.end}
        - Evening: ${state.settings.standardSlots.evening.start} to ${state.settings.standardSlots.evening.end}
        - Night: ${state.settings.standardSlots.night.start} to ${state.settings.standardSlots.night.end}
        
        Suggest exactly when and how to slot these missed topics into my next 3 days without overwhelming my daily limit of ~10 hours. 
        Be professional, motivating, and specific. Use Markdown.
      `;

      const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
      });
      setMakeupPlan(response.text);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMakeupPlan("Failed to generate plan. Please try again later.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <UPSCContext.Provider value={{ 
      state, 
      updateTask, 
      markTaskComplete, 
      updateSettings, 
      addUnachievedGoal, 
      removeUnachievedGoal,
      setTasksForDay,
      generateMakeupPlan,
      isGeneratingPlan,
      makeupPlan,
      initDayIfMissing,
      updateProgress,
      isLoaded
    }}>
      {children}
    </UPSCContext.Provider>
  );
};

export const useUPSC = () => {
  const context = useContext(UPSCContext);
  if (context === undefined) {
    throw new Error('useUPSC must be used within a UPSCProvider');
  }
  return context;
};
