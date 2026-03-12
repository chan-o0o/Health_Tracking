import { useState, useEffect } from 'react';
import { db, type HealthLog, type LogType } from '../db/db';
import { format, differenceInMinutes, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from 'date-fns';
import { Utensils, Dumbbell, Scale, Filter, Trash2, Calendar as CalendarIcon, List } from 'lucide-react';
import Calendar from 'react-calendar';
import PhotoModal from './PhotoModal';

interface HistorySectionProps {
  refreshTrigger: number;
}

type ViewMode = 'list' | 'calendar';

export default function HistorySection({ refreshTrigger }: HistorySectionProps) {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [filter, setFilter] = useState<LogType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPhoto, setSelectedPhoto] = useState<Blob | null>(null);
  const [fastingElapsed, setFastingElapsed] = useState<string>('00:00:00');

  useEffect(() => {
    const fetchLogs = async () => {
      let query = db.logs.orderBy('timestamp').reverse();
      const allLogs = await query.toArray();
      setLogs(allLogs);
    };
    fetchLogs();
  }, [refreshTrigger]);

  const lastFastingLog = logs.find(l => l.type === 'fasting');
  const isCurrentlyFasting = lastFastingLog && !lastFastingLog.data.isEating;

  useEffect(() => {
    if (!isCurrentlyFasting) {
      setFastingElapsed('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const diff = new Date().getTime() - new Date(lastFastingLog.timestamp).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setFastingElapsed(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isCurrentlyFasting, lastFastingLog]);

  const handleDelete = async (id: number) => {
    if (confirm('Delete this log?')) {
      await db.logs.delete(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    }
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.type === filter);

  // Grouping logic for the list view
  const groupLogsByDay = () => {
    const groups: Record<string, HealthLog[]> = {};
    const sourceLogs = viewMode === 'calendar' 
      ? filteredLogs.filter(l => isSameDay(new Date(l.timestamp), selectedDate))
      : filteredLogs;

    sourceLogs.forEach(log => {
      const day = format(new Date(log.timestamp), 'yyyy.MM.dd (EEE)');
      if (!groups[day]) groups[day] = [];
      groups[day].push(log);
    });
    return groups;
  };

  const dayGroups = groupLogsByDay();

  const getDuration = (start: Date, end: Date) => {
    const totalMinutes = differenceInMinutes(end, start);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Stats for the week
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const weekLogs = logs.filter(l => isWithinInterval(new Date(l.timestamp), { start: weekStart, end: weekEnd }));
  
  const workoutCount = weekLogs.filter(l => l.type === 'workout' && l.data.action === 'start').length;
  const lastWeightLog = logs.find(l => l.type === 'weight');
  const latestWeight = lastWeightLog ? lastWeightLog.data.value : '-';

  // Calendar tile content (dots)
  const getTileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view !== 'month') return null;

    const dayLogs = logs.filter(l => isSameDay(new Date(l.timestamp), date));
    if (dayLogs.length === 0) return null;

    const hasWorkout = dayLogs.some(l => l.type === 'workout');
    const hasWeight = dayLogs.some(l => l.type === 'weight');
    const hasFasting = dayLogs.some(l => l.type === 'fasting');

    return (
      <div className="flex gap-0.5 mt-1 justify-center absolute bottom-1 left-0 right-0">
        {hasWorkout && <div className="dot-indicator bg-blue-500" />}
        {hasWeight && <div className="dot-indicator bg-emerald-500" />}
        {hasFasting && <div className="dot-indicator bg-orange-500" />}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}

      {/* Quick Stats */}
      <div className="space-y-4">
        {isCurrentlyFasting && (
          <div className="card mb-0 bg-orange-500/10 border-orange-500/20 flex flex-col items-center justify-center p-6 border-2 border-dashed">
            <span className="text-xs uppercase text-orange-500 font-black tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Real-time Fasting
            </span>
            <span className="text-4xl font-black text-orange-500 font-mono tracking-tight">{fastingElapsed}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="card mb-0 flex flex-col items-center justify-center p-5">
            <span className="text-xs uppercase text-zinc-500 font-black tracking-widest mb-1">Workouts this week</span>
            <span className="text-3xl font-black text-blue-500">{workoutCount}</span>
          </div>
          <div className="card mb-0 flex flex-col items-center justify-center p-5">
            <span className="text-xs uppercase text-zinc-500 font-black tracking-widest mb-1">Latest Weight</span>
            <span className="text-3xl font-black text-emerald-500">{latestWeight}<small className="text-sm ml-1 font-bold">kg</small></span>
          </div>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 flex-1">
                <Filter className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                {(['all', 'fasting', 'workout', 'weight'] as const).map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2 rounded-full text-sm font-black capitalize whitespace-nowrap transition-all ${
                    filter === f ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}
                >
                    {f}
                </button>
                ))}
            </div>
            <div className="flex bg-zinc-900 rounded-2xl p-1.5 border border-zinc-800 ml-4">
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-zinc-100 text-zinc-950 shadow-lg' : 'text-zinc-500'}`}
                >
                    <CalendarIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-zinc-100 text-zinc-950 shadow-lg' : 'text-zinc-500'}`}
                >
                    <List className="w-5 h-5" />
                </button>
            </div>
        </div>

        {viewMode === 'calendar' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <Calendar
              onChange={(val) => setSelectedDate(val as Date)}
              value={selectedDate}
              tileContent={getTileContent}
              className="w-full"
              locale="en-US"
              formatShortWeekday={(_, date) => format(date, 'E')[0]}
            />
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-8">
        {Object.keys(dayGroups).length === 0 ? (
           <div className="text-center py-16">
             <p className="text-zinc-500 font-black text-base uppercase tracking-widest">No entries for this view</p>
           </div>
        ) : (
          Object.entries(dayGroups).map(([day, dayLogs]) => (
            <div key={day} className="space-y-5">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest sticky top-12 bg-zinc-950/90 backdrop-blur-xl py-3 z-10 border-b border-zinc-900/50" style={{ top: 'calc(env(safe-area-inset-top) + 2rem)' }}>
                {day}
              </h3>
              
              <div className="space-y-4">
                {dayLogs.map((log) => {
                  const isFasting = log.type === 'fasting';
                  const isWorkout = log.type === 'workout';
                  const isWeight = log.type === 'weight';

                  return (
                    <div key={log.id} className="group relative">
                      <div className="flex items-start gap-5 p-5 bg-zinc-900/40 rounded-[2rem] border border-zinc-800/60 shadow-sm">
                        {isFasting && (
                          <div className={`p-3.5 rounded-2xl ${!log.data.isEating ? 'bg-orange-500/15 text-orange-500' : 'bg-zinc-800 text-zinc-400'}`}>
                            <Utensils className="w-6 h-6" />
                          </div>
                        )}
                        {isWorkout && (
                          <div className="p-3.5 rounded-2xl bg-blue-500/15 text-blue-500">
                            <Dumbbell className="w-6 h-6" />
                          </div>
                        )}
                        {isWeight && (
                          <div className="p-3.5 rounded-2xl bg-emerald-500/15 text-emerald-500">
                            <Scale className="w-6 h-6" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <div className="font-black text-lg">
                              {isFasting && (
                                <span>
                                  {!log.data.isEating ? 'Started Fasting' : 'Started Eating'}
                                  {(() => {
                                    const nextLog = logs.find(l => l.type === 'fasting' && l.timestamp > log.timestamp);
                                    return nextLog ? <span className="text-zinc-500 font-bold ml-2">({getDuration(new Date(log.timestamp), new Date(nextLog.timestamp))})</span> : null;
                                  })()}
                                </span>
                              )}
                              {isWorkout && (
                                <span>
                                  {log.data.action === 'start' ? 'Workout Started' : 'Workout Ended'}
                                  {log.data.action === 'start' && (() => {
                                     const endLog = logs.find(l => l.type === 'workout' && l.data.action === 'end' && l.timestamp > log.timestamp);
                                     return endLog ? <span className="text-zinc-500 font-bold ml-2">({getDuration(new Date(log.timestamp), new Date(endLog.timestamp))})</span> : null;
                                  })()}
                                </span>
                              )}
                              {isWeight && <span>Weight: <span className="text-emerald-500">{log.data.value}kg</span></span>}
                            </div>
                            <span className="text-lg font-mono text-zinc-100 font-bold">{format(new Date(log.timestamp), 'HH:mm')}</span>
                          </div>

                          {isFasting && log.data.note && (
                            <div className="mt-3 p-4 bg-zinc-800/40 rounded-2xl border border-zinc-700/20">
                              <p className="text-base italic text-zinc-300 leading-relaxed font-medium whitespace-pre-line">
                                "{log.data.note}"
                              </p>
                            </div>
                          )}

                          {isWorkout && log.data.muscleGroups && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {log.data.muscleGroups.map((m: string) => (
                                <span key={m} className="px-3 py-1 bg-zinc-800 rounded-xl text-xs text-zinc-300 font-black uppercase tracking-widest border border-zinc-700/50 shadow-sm">{m}</span>
                              ))}
                            </div>
                          )}

                          {isWeight && log.data.photos && log.data.photos.length > 0 && (
                            <div className="flex gap-3 mt-4">
                              {log.data.photos.map((photo: Blob, idx: number) => (
                                <div 
                                  key={idx} 
                                  className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-700/50 active:scale-95 transition-transform cursor-pointer shadow-md"
                                  onClick={() => setSelectedPhoto(photo)}
                                >
                                  <img src={URL.createObjectURL(photo)} alt="Progress" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => handleDelete(log.id!)}
                          className="p-2 text-red-500/80 active:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
