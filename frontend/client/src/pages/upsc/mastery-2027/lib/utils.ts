import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Subject = 'Mathematics' | 'General Studies' | 'Language' | 'Revision';

export interface Task {
  id: string;
  title: string;
  subject: Subject;
  completed: boolean;
  pomodorosRequired: number;
  pomodorosDone: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  revisionsScheduled?: boolean;
  needsRevision?: boolean;
  elapsedSeconds?: number;
}

export interface DayData {
  date: string; // YYYY-MM-DD
  tasks: Task[];
  isDayFinished: boolean;
  actualSleepTime?: string;
}

export interface Settings {
  pomodoroWork: number;
  pomodoroBreak: number;
  sleepTargetTime: string; // e.g. "02:00"
  soundEnabled: boolean;
  standardSlots: {
    afternoon: { start: string; end: string };
    evening: { start: string; end: string };
    night: { start: string; end: string };
  };
}

export interface AppState {
  history: Record<string, DayData>;
  unachievedGoals: Task[];
  settings: Settings;
  mathProgress: number; // 0-100
  gsProgress: number;   // 0-100
}

export const INITIAL_SETTINGS: Settings = {
  pomodoroWork: 50,
  pomodoroBreak: 10,
  sleepTargetTime: "02:00",
  soundEnabled: true,
  standardSlots: {
    afternoon: { start: "12:00", end: "17:00" },
    evening: { start: "18:30", end: "20:30" },
    night: { start: "22:00", end: "01:30" },
  }
};

export const DEFAULT_TASKS: Omit<Task, 'id' | 'completed' | 'pomodorosDone'>[] = [
  { 
    title: "Afternoon Mathematics", 
    subject: "Mathematics", 
    pomodorosRequired: 4, 
    startTime: "12:00", 
    endTime: "17:00" 
  },
  { 
    title: "Evening General Studies", 
    subject: "General Studies", 
    pomodorosRequired: 2, 
    startTime: "18:30", 
    endTime: "20:30" 
  },
  { 
    title: "Night GS/Revision", 
    subject: "Revision", 
    pomodorosRequired: 2, 
    startTime: "22:00", 
    endTime: "00:30" 
  },
  { 
    title: "Language and Revision", 
    subject: "Language", 
    pomodorosRequired: 1, 
    startTime: "00:30", 
    endTime: "01:30" 
  },
  {
    title: "Revision",
    subject: "Revision",
    pomodorosRequired: 1,
    startTime: "23:30",
    endTime: "00:30"
  }
];
