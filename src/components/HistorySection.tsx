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

  useEffect(() => {
    const fetchLogs = async () => {
      let query = db.logs.orderBy('timestamp').reverse();
      const allLogs = await query.toArray();
      setLogs(allLogs);
    };
    fetchLogs();
  }, [refreshTrigger]);

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
  const weightEntries = weekLogs.filter(l => l.type === 'weight');
  const latestWeight = weightEntries.length > 0 ? weightEntries[0].data.value : '-';

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
      <div className="grid grid-cols-2 gap-4">
        <div className="card mb-0 flex flex-col items-center justify-center p-4">
          <span className="text-[10px] uppercase text-zinc-500 font-black">Workouts this week</span>
          <span className="text-2xl font-black text-blue-500">{workoutCount}</span>
        </div>
        <div className="card mb-0 flex flex-col items-center justify-center p-4">
          <span className="text-[10px] uppercase text-zinc-500 font-black">Latest Weight</span>
          <span className="text-2xl font-black text-emerald-500">{latestWeight}<small className="text-xs ml-1">kg</small></span>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
                <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                {(['all', 'fasting', 'workout', 'weight'] as const).map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all ${
                    filter === f ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}
                >
                    {f}
                </button>
                ))}
            </div>
            <div className="flex bg-zinc-900 rounded-2xl p-1 border border-zinc-800 ml-4">
                <button 
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-zinc-100 text-zinc-950 shadow-lg' : 'text-zinc-500'}`}
                >
                    <CalendarIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-zinc-100 text-zinc-950 shadow-lg' : 'text-zinc-500'}`}
                >
                    <List className="w-4 h-4" />
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
           <div className="text-center py-12">
             <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">No entries for this view</p>
           </div>
        ) : (
          Object.entries(dayGroups).map(([day, dayLogs]) => (
            <div key={day} className="space-y-4">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest sticky top-0 bg-zinc-950/80 backdrop-blur py-2 z-10">
                {day}
              </h3>
              
              <div className="space-y-3">
                {dayLogs.map((log) => {
                  const isFasting = log.type === 'fasting';
                  const isWorkout = log.type === 'workout';
                  const isWeight = log.type === 'weight';

                  return (
                    <div key={log.id} className="group relative">
                      <div className="flex items-start gap-4 p-4 bg-zinc-900/50 rounded-3xl border border-zinc-800/50">
                        {isFasting && (
                          <div className={`p-2.5 rounded-2xl ${!log.data.isEating ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-800 text-zinc-400'}`}>
                            <Utensils className="w-5 h-5" />
                          </div>
                        )}
                        {isWorkout && (
                          <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                            <Dumbbell className="w-5 h-5" />
                          </div>
                        )}
                        {isWeight && (
                          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <Scale className="w-5 h-5" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-sm">
                              {isFasting && (
                                <span>
                                  {!log.data.isEating ? 'Started Fasting' : 'Started Eating'}
                                  {(() => {
                                    const nextLog = logs.find(l => l.type === 'fasting' && l.timestamp > log.timestamp);
                                    return nextLog ? <span className="text-zinc-500 font-normal ml-2">({getDuration(new Date(log.timestamp), new Date(nextLog.timestamp))})</span> : null;
                                  })()}
                                </span>
                              )}
                              {isWorkout && (
                                <span>
                                  {log.data.action === 'start' ? 'Workout Started' : 'Workout Ended'}
                                  {log.data.action === 'start' && (() => {
                                     const endLog = logs.find(l => l.type === 'workout' && l.data.action === 'end' && l.timestamp > log.timestamp);
                                     return endLog ? <span className="text-zinc-500 font-normal ml-2">({getDuration(new Date(log.timestamp), new Date(endLog.timestamp))})</span> : null;
                                  })()}
                                </span>
                              )}
                              {isWeight && <span>Weight: {log.data.value}kg</span>}
                            </div>
                            <span className="text-xs font-mono text-zinc-500">{format(new Date(log.timestamp), 'HH:mm')}</span>
                          </div>

                          {isFasting && log.data.note && (
                            <div className="mt-2 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/30">
                              <p className="text-sm italic text-zinc-400 leading-relaxed font-medium whitespace-pre-line">
                                "{log.data.note}"
                              </p>
                            </div>
                          )}

                          {isWorkout && log.data.muscleGroups && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {log.data.muscleGroups.map((m: string) => (
                                <span key={m} className="px-2.5 py-1 bg-zinc-800 rounded-lg text-xs text-zinc-400 font-bold uppercase tracking-wider border border-zinc-700/50">{m}</span>
                              ))}
                            </div>
                          )}

                          {isWeight && log.data.photos && log.data.photos.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {log.data.photos.map((photo: Blob, idx: number) => (
                                <div 
                                  key={idx} 
                                  className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-800 active:scale-95 transition-transform cursor-pointer"
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
                          className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
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
