import React, { useState, useEffect } from 'react';
import { useUPSC } from '../UPSCContext';
import { Save, Clock, Moon, Coffee, Calendar, Plus, Trash2, Edit3, Bell, BellOff } from 'lucide-react';
import { Task, Subject } from '../lib/utils';
import { format, addDays, parseISO } from 'date-fns';
import { getDayData } from '../lib/scheduleData';

export const YogaSettings: React.FC = () => {
  const { state, updateSettings, setTasksForDay } = useUPSC();

  const [futureDate, setFutureDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [futureTasks, setFutureTasks] = useState<Task[]>([]);
  const [saveIndicator, setSaveIndicator] = useState(false);

  useEffect(() => {
    const existingDay = state.history[futureDate];
    if (existingDay && existingDay.tasks.length > 0) {
      setFutureTasks(existingDay.tasks);
    } else {
      const schedule = getDayData(futureDate);
      const initialTasks = [
          {
            id: Math.random().toString(36).substr(2, 9),
            title: schedule.gs,
            subject: 'General Studies',
            pomodorosRequired: 5,
            pomodorosDone: 0,
            completed: false,
            startTime: state.settings.standardSlots.afternoon.start,
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
            endTime: state.settings.standardSlots.afternoon.end,
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            title: schedule.eve,
            subject: 'General Studies',
            pomodorosRequired: 4,
            pomodorosDone: 0,
            completed: false,
            startTime: state.settings.standardSlots.evening.start,
            endTime: state.settings.standardSlots.evening.end,
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            title: schedule.night,
            subject: 'Revision',
            pomodorosRequired: 2,
            pomodorosDone: 0,
            completed: false,
            startTime: state.settings.standardSlots.night.start,
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
            endTime: state.settings.standardSlots.night.end,
          }
        ];
      setFutureTasks(initialTasks as Task[]);
    }
  }, [futureDate, state.history, state.settings.standardSlots]);

  const handleFutureTaskChange = (taskId: string, field: keyof Task, value: any) => {
    setFutureTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));
  };

  const addFutureTask = () => {
    setFutureTasks(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      title: "New Task",
      subject: "General Studies",
      completed: false,
      pomodorosRequired: 2,
      pomodorosDone: 0,
      startTime: "12:00",
      endTime: "14:00"
    }]);
  };

  const removeFutureTask = (taskId: string) => {
    setFutureTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const saveFutureTasks = () => {
    setTasksForDay(futureDate, futureTasks);
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  };

  const handleSlotChange = (block: 'afternoon' | 'evening' | 'night', type: 'start' | 'end', val: string) => {
    const newSlots = { ...state.settings.standardSlots };
    newSlots[block][type] = val;
    updateSettings({ standardSlots: newSlots });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Yoga Settings</h2>
        <p className="text-slate-500">Tune your environment for maximum efficiency.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">
          {/* Pomodoro */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-700">
                <Coffee size={18} className="text-blue-600" /> Focus Rhythm
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Work (mins)</label>
                    <input 
                        type="number" 
                        value={isNaN(state.settings.pomodoroWork) ? '' : state.settings.pomodoroWork} 
                        onChange={(e) => updateSettings({ pomodoroWork: parseInt(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Break (mins)</label>
                    <input 
                        type="number" 
                        value={isNaN(state.settings.pomodoroBreak) ? '' : state.settings.pomodoroBreak} 
                        onChange={(e) => updateSettings({ pomodoroBreak: parseInt(e.target.value) })}
                        className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                    {state.settings.soundEnabled ? <Bell size={18} className="text-blue-500" /> : <BellOff size={18} className="text-slate-400" />}
                    <div>
                        <p className="text-sm font-semibold text-slate-700">Sound Cues</p>
                        <p className="text-xs text-slate-500">Play sound on timer start and completion</p>
                    </div>
                </div>
                <button
                    onClick={() => updateSettings({ soundEnabled: !state.settings.soundEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${state.settings.soundEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
          </section>

          {/* Slots */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-700">
                <Calendar size={18} className="text-blue-600" /> Standard Slots
            </h3>
            <div className="space-y-3">
                {(['afternoon', 'evening', 'night'] as const).map(block => (
                    <div key={block} className="flex items-center gap-4">
                        <span className="w-24 capitalize text-sm font-semibold text-slate-500">{block}</span>
                        <input 
                            type="time" 
                            value={state.settings.standardSlots[block].start}
                            onChange={(e) => handleSlotChange(block, 'start', e.target.value)}
                            className="bg-slate-50 border-none rounded-xl p-2 text-sm"
                        />
                        <span className="text-slate-300">to</span>
                        <input 
                            type="time" 
                            value={state.settings.standardSlots[block].end}
                            onChange={(e) => handleSlotChange(block, 'end', e.target.value)}
                            className="bg-slate-50 border-none rounded-xl p-2 text-sm"
                        />
                    </div>
                ))}
            </div>
          </section>

          {/* Sleep Target */}
          <section className="space-y-4">
             <h3 className="flex items-center gap-2 font-bold text-slate-700">
                <Moon size={18} className="text-blue-600" /> Sleep Discipline
            </h3>
            <div className="flex items-center gap-4">
                <label className="text-sm text-slate-500">Day Rollover Time</label>
                <input 
                    type="time" 
                    value={state.settings.sleepTargetTime}
                    onChange={(e) => updateSettings({ sleepTargetTime: e.target.value })}
                    className="bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 italic flex-1">
                    Tasks not finished by this time will be considered "missed".
                </p>
            </div>
          </section>

          {/* Daily Blueprint Override */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-slate-700">
                    <Edit3 size={18} className="text-blue-600" /> Daily Blueprint Override
                </h3>
                <input 
                    type="date"
                    value={futureDate}
                    onChange={(e) => setFutureDate(e.target.value)}
                    className="bg-slate-50 border-none rounded-xl p-2 text-sm font-semibold text-slate-700"
                />
            </div>
            
            <div className="space-y-3">
                {futureTasks.map((task) => (
                    <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <textarea 
                                value={task.title.replace(/\\n/g, '\n')}
                                onChange={(e) => handleFutureTaskChange(task.id, 'title', e.target.value)}
                                className="flex-1 bg-slate-50 border-none rounded-lg p-2 text-sm font-semibold text-slate-800 resize-none min-h-[60px]"
                                placeholder="Task Title"
                            />
                            <button 
                                onClick={() => removeFutureTask(task.id)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={task.subject}
                                onChange={(e) => handleFutureTaskChange(task.id, 'subject', e.target.value)}
                                className="bg-slate-50 border-none rounded-lg p-2 text-xs font-semibold text-slate-600 w-32"
                            >
                                {['Mathematics', 'General Studies', 'Language', 'Revision'].map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                            
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Poms:</span>
                                <input 
                                    type="number"
                                    min="1"
                                    value={isNaN(task.pomodorosRequired) ? '' : task.pomodorosRequired}
                                    onChange={(e) => handleFutureTaskChange(task.id, 'pomodorosRequired', parseInt(e.target.value))}
                                    className="w-12 bg-white border-none rounded px-2 py-1 text-xs text-center font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Time:</span>
                                <input 
                                    type="time"
                                    value={task.startTime}
                                    onChange={(e) => handleFutureTaskChange(task.id, 'startTime', e.target.value)}
                                    className="bg-white border-none rounded px-2 py-1 text-xs font-mono"
                                />
                                <span className="text-slate-400 text-xs">-</span>
                                <input 
                                    type="time"
                                    value={task.endTime}
                                    onChange={(e) => handleFutureTaskChange(task.id, 'endTime', e.target.value)}
                                    className="bg-white border-none rounded px-2 py-1 text-xs font-mono"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                
                <button 
                    onClick={addFutureTask}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <Plus size={16} /> Add Custom Task block
                </button>
            </div>
            
            <div className="flex justify-end pt-2">
                <button 
                    onClick={saveFutureTasks}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/40"
                >
                    <Save size={18} /> {saveIndicator ? "Schedule Saved!" : `Save Schedule for ${format(parseISO(futureDate), 'MMM do')}`}
                </button>
            </div>
          </section>
          {/* App Data Management */}
          <section className="space-y-4 pt-6 border-t border-slate-100">
             <h3 className="flex items-center gap-2 font-bold text-slate-700">
                <Trash2 size={18} className="text-red-500" /> Danger Zone
            </h3>
            <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-bold text-slate-800">Factory Reset</p>
                   <p className="text-xs text-slate-500">Deletes all local progress, schedules, and unachieved tasks.</p>
                </div>
                <button 
                   onClick={() => {
                       if (window.confirm('Are you absolutely sure you want to delete all data? This cannot be undone.')) {
                           localStorage.removeItem('arjun_ai_state');
                           window.location.reload();
                       }
                   }}
                   className="px-4 py-2 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                   Reset App
                </button>
            </div>
          </section>
        </div>
        
        <div className="bg-slate-50 p-6 flex items-center justify-between border-t border-slate-200">
            <p className="text-[10px] text-slate-400">Settings are automatically saved to your browser.</p>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Save size={16} /> Saved
            </div>
        </div>
      </div>
    </div>
  );
};
