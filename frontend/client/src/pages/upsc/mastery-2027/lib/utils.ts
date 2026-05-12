import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SOUNDS = [
  'mixkit-birds-chirping-in-the-jungle-2433.wav',
  'mixkit-birds-chirping-near-the-river-2473.wav',
  'mixkit-birds-in-the-jungle-2434.wav',
  'mixkit-breeze-through-the-trees-2427.wav',
  'mixkit-calm-thunderstorm-in-the-jungle-2415.wav',
  'mixkit-cockatoo-bird-squawk-2437.wav',
  'mixkit-dry-leaves-sound-2428.wav',
  'mixkit-evil-storm-atmosphere-2404.wav',
  'mixkit-fish-moving-in-water-2921.wav',
  'mixkit-heavy-rain-2403.wav',
  'mixkit-heavy-rain-and-thunder-in-background-2406.wav',
  'mixkit-heavy-rain-drops-2399.wav',
  'mixkit-heavy-storm-rain-loop-2400.wav',
  'mixkit-jungle-rain-and-birds-2392.wav',
  'mixkit-light-rain-loop-2393.wav',
  'mixkit-liquid-bubble-3000.wav',
  'mixkit-morning-birds-2472.wav',
  'mixkit-night-forest-with-insects-2414.wav',
  'mixkit-rain-and-thunder-storm-2390.wav',
  'mixkit-rain-in-the-jungle-and-birds-2431.wav',
  'mixkit-rain-long-loop-2394.wav',
  'mixkit-river-surroundings-in-the-jungle-2451.wav',
  'mixkit-strong-wild-wind-in-a-storm-2407.wav',
  'mixkit-thunder-rumble-and-light-rain-2401.wav',
  'mixkit-thunder-rumble-during-a-storm-2395.wav',
  'mixkit-thunder-strike-in-storm-2405.wav',
  'mixkit-thunderstorm-and-clear-rain-2397.wav',
  'mixkit-thunderstorm-and-rain-2391.wav',
  'mixkit-thunderstorm-and-rain-loop-2402.wav',
  'mixkit-thunderstorm-background-sound-2398.wav',
  'mixkit-thunderstorm-in-the-forest-2396.wav',
  'mixkit-urban-ambience-during-the-day-2505.wav',
  'mixkit-volcano-eruption-with-lava-flow-2443.wav',
  'mixkit-water-flowing-ambience-loop-3126.wav',
  'mixkit-wind-blowing-ambience-2658.wav',
  'mixkit-wolves-at-scary-forest-2485.wav'
];

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
  selectedSound?: string;
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
  selectedSound: 'mixkit-birds-chirping-in-the-jungle-2433.wav',
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
    pomodorosRequired: 1, 
    startTime: "12:00", 
    endTime: "17:00" 
  },
  { 
    title: "Evening General Studies", 
    subject: "General Studies", 
    pomodorosRequired: 1, 
    startTime: "18:30", 
    endTime: "20:30" 
  },
  { 
    title: "Night GS/Revision", 
    subject: "Revision", 
    pomodorosRequired: 1, 
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
