import React, { useState } from 'react';
import { mathByDay, gsByDate } from '../lib/timetable';
import { BookOpen, Map, GraduationCap, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const SyllabusView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'math' | 'gs'>('overview');

    const appendixA = [
        'Week 1–2:   Linear Algebra & Matrices (days 1–14)',
        'Week 3:     Numerical Analysis (days 15–21)',
        'Week 4:     Vector Analysis (days 22–28)',
        'Week 5–6:   Ordinary Differential Equations (days 29–42)',
        'Week 7–8:   Partial Differential Equations (days 43–56)',
        'Week 9–11:  Calculus & Real Analysis (days 57–79)',
        'Week 12:    Complex Analysis (days 80–86)',
        'Week 13–14: Analytic Geometry (days 87–100)',
        'Week 15:    Linear Programming (days 101–108)',
        'Week 16:    Mechanics (days 109–116)',
        'Week 17–18: Fluid Dynamics (days 117–128)',
        'Week 19–20: Abstract Algebra (days 129–143)',
        'Week 21:    Dynamics (days 144–150)',
        'Week 22:    Statics (days 151–157)',
        'Oct 2026+:  Revision Cycles 1–7 → PYQ Answer Writing → Prelims Phase',
        'Jun 2027+:  Intensive Mains Preparation (3–4 hrs/day)'
    ];

    const appendixB = [
        { label: 'Paper B: English (Qualifying)', details: [
            'Months 1–2: Read The Hindu daily; note editorial vocabulary and sentence structures',
            'Months 3–4: Practice précis writing (2×/week, 200→100 words); formal letters (1×/week)',
            'Months 5–6: Short essay writing (300 words, 1×/week); translation',
            'Months 7–8: Practice from previous year English papers; reading comprehension',
            'Month 9+:   2 full mock papers per month'
        ] },
        { label: 'Paper A: Odia (Qualifying)', details: [
            'Months 1–2: Daily Odia newspaper reading (Samaj/Pragativadi); 30 min/day',
            'Months 3–4: Odia paragraph writing (1 per week); reading comprehension',
            'Months 5–6: Odia essay outlines; letter writing; grammar exercises',
            'Months 7–8: Short essay writing in Odia; translation practice',
            'Month 9+:   Full Odia practice; 2 mocks/month'
        ] },
    ];

    const gsDates = Object.keys(gsByDate).sort();

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4 md:p-6 text-foreground h-full">
            <header className="flex flex-col border-b border-border pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Syllabus <span className="font-normal text-muted-foreground">/ STRATEGY & TOPICS</span>
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Comprehensive overview of the 2027 Study Plan
                </p>
            </header>

            <div className="flex gap-2 p-1 bg-muted rounded-xl max-w-fit">
                <button
                onClick={() => setActiveTab('overview')}
                className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
                    activeTab === 'overview' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                ><Map size={16} className="inline mr-2" />Overview & Strategy</button>
                <button
                onClick={() => setActiveTab('math')}
                className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
                    activeTab === 'math' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                ><GraduationCap size={16} className="inline mr-2" />Math Per Day</button>
                <button
                onClick={() => setActiveTab('gs')}
                className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-colors",
                    activeTab === 'gs' ? "bg-background text-emerald-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                ><BookOpen size={16} className="inline mr-2" />GS Per Day</button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                >
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
                            <div>
                                <h3 className="text-lg font-bold text-foreground border-b border-border pb-2 mb-4">Mathematics 22-Week Topic Map</h3>
                                <div className="space-y-2">
                                    {appendixA.map((str, i) => (
                                        <div key={i} className="text-sm text-muted-foreground bg-card p-3 rounded-lg border border-border shadow-sm">
                                            {str}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground border-b border-border pb-2 mb-4">Language Paper Strategy</h3>
                                <div className="space-y-6">
                                    {appendixB.map((s, i) => (
                                        <div key={i}>
                                            <h4 className="font-bold text-muted-foreground mb-3">{s.label}</h4>
                                            <ul className="space-y-2">
                                                {s.details.map((l, j) => (
                                                    <li key={j} className="text-sm text-muted-foreground bg-card p-3 rounded-lg border border-border shadow-sm list-inside list-disc">
                                                        <span className="ml-[-10px]">{l}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl">
                                    <h4 className="font-bold text-emerald-500 mb-2">TARGET</h4>
                                    <p className="text-sm text-emerald-600/80 font-medium">Both qualifying papers – score 50–60% of marks comfortably. 90-100/300 is sufficient to qualify.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'math' && (
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-4 bg-muted border-b border-border text-sm font-bold text-muted-foreground flex justify-between">
                                <span>Day Number</span>
                                <span>Mathematics Topic</span>
                            </div>
                            <div className="divide-y divide-border/50">
                                {Array.from({length: 157}, (_, i) => i + 1).map(day => (
                                    <div key={day} className="p-4 flex flex-col sm:flex-row sm:items-start gap-4 hover:bg-muted/50 transition-colors">
                                        <div className="text-sm font-bold text-primary min-w-[80px]">
                                            Day {day}
                                        </div>
                                        <div className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                                            {mathByDay[day] ? mathByDay[day].replace(/\\n/g, '\n') : 'Revision / Practice'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'gs' && (
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden pb-10">
                            <div className="p-4 bg-muted border-b border-border text-sm font-bold text-muted-foreground flex justify-between">
                                <span>Date</span>
                                <span>GS Topic</span>
                            </div>
                            <div className="divide-y divide-border/50">
                                {gsDates.map(date => (
                                    <div key={date} className="p-4 flex flex-col sm:flex-row sm:items-start gap-4 hover:bg-muted/50 transition-colors">
                                        <div className="text-sm font-bold text-emerald-500 min-w-[100px]">
                                            {date}
                                        </div>
                                        <div className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                                            {gsByDate[date].replace(/\\n/g, '\n')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
