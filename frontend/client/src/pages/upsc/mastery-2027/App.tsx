/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UPSCProvider, useUPSC } from './UPSCContext';
import { ExecutionView } from './components/ExecutionView';
import { DronaDashboard } from './components/DronaDashboard';
import { KarmaBacklog } from './components/KarmaBacklog';
import { YogaSettings } from './components/YogaSettings';
import { SyllabusView } from './components/SyllabusView';
import { Layout, Play, LayoutDashboard, History, Settings, Sparkles, BookOpen } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'wouter';

type View = 'execution' | 'dashboard' | 'backlog' | 'settings' | 'syllabus';

const AppContent = () => {
  const [activeView, setActiveView] = useState<View>('execution');

  const navItems = [
    { id: 'dashboard', label: 'Drona Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'execution', label: 'Execution Hub', icon: <Play size={20} /> },
    { id: 'backlog', label: 'Karma Backlog', icon: <History size={20} /> },
    { id: 'syllabus', label: 'Syllabus & Map', icon: <BookOpen size={20} /> },
    { id: 'settings', label: 'Yoga Settings', icon: <Settings size={20} /> },
  ] as const;

  const { isLoaded } = useUPSC();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse">
              <Sparkles size={24} />
            </div>
            <p className="text-slate-500 font-medium animate-pulse">Loading Mastery State...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <nav className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-row md:flex-col items-center md:items-stretch overflow-x-auto md:overflow-x-visible">
        <Link href="/">
          <div className="flex items-center gap-3 mb-0 md:mb-10 mr-8 md:mr-0 cursor-pointer group">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:bg-blue-700 transition-colors">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <h1 className="font-black text-xl text-slate-800 hidden md:block group-hover:text-blue-600 transition-colors">PrepUp</h1>
          </div>
        </Link>

        <div className="flex flex-row md:flex-col gap-2 w-full">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold whitespace-nowrap",
                activeView === item.id 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-10 hidden md:block">
            <div className="bg-slate-900 rounded-2xl p-6 text-white text-xs relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                    <p className="font-medium opacity-80 leading-relaxed">
                        "Arise, awake, and stop not until the goal is reached."
                    </p>
                    <p className="text-[10px] font-bold text-blue-400">— Swami Vivekananda</p>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-10">
                    <Sparkles size={100} />
                </div>
            </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeView === 'dashboard' && <DronaDashboard />}
            {activeView === 'execution' && <ExecutionView />}
            {activeView === 'backlog' && <KarmaBacklog />}
            {activeView === 'syllabus' && <SyllabusView />}
            {activeView === 'settings' && <YogaSettings />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <UPSCProvider>
      <AppContent />
    </UPSCProvider>
  );
}

