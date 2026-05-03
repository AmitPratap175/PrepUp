import { gsByDate, getMathForDate, getEvening, getNight } from './timetable';

export function getDayData(dateStr: string) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      
      return {
          gs: gsByDate[dateStr] || 'GS SELF-STUDY\nRevision / Notes consolidation\n+ MCQ practice',
          math: getMathForDate(y, m, d),
          eve: getEvening(y, m, d),
          night: getNight(y, m, d, Math.max(1, m - 2)),
      };
    }
    
    // Fallback if parsing fails (should not happen)
    return {
        gs: gsByDate['2026-05-27'] || 'GS SELF-STUDY\nRevision / Notes consolidation\n+ MCQ practice',
        math: getMathForDate(2026, 5, 27),
        eve: getEvening(2026, 5, 27),
        night: getNight(2026, 5, 27, 3),
    };
}
