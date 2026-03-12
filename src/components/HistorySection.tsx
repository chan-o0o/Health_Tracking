import { useState, useEffect } from 'react';
import { db, type HealthLog, type LogType } from '../db/db';
import { format, differenceInMinutes, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Utensils, Dumbbell, Scale, Filter, Trash2 } from 'lucide-react';

interface HistorySectionProps {
  refreshTrigger: number;
}

export default function HistorySection({ refreshTrigger }: HistorySectionProps) {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [filter, setFilter] = useState<LogType | 'all'>('all');

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
      // Simple local update
      setLogs(prev => prev.filter(l => l.id !== id));
    }
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.type === filter);

  // Grouping logic
  const groupLogsByDay = () => {
    const groups: Record<string, HealthLog[]> = {};
    filteredLogs.forEach(log => {
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

  // Stats calculation (this week)
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const weekLogs = logs.filter(l => isWithinInterval(new Date(l.timestamp), { start: weekStart, end: weekEnd }));
  
  const workoutCount = weekLogs.filter(l => l.type === 'workout' && l.data.action === 'start').length;
  const weightEntries = weekLogs.filter(l => l.type === 'weight');
  const latestWeight = weightEntries.length > 0 ? weightEntries[0].data.value : '-';

  return (
    <div className="space-y-6 pb-20">
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

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
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

      {/* History List */}
      <div className="space-y-8">
        {Object.entries(dayGroups).map(([day, dayLogs]) => (
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
                            <p className="text-sm italic text-zinc-400 leading-relaxed font-medium">
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
                              <div key={idx} className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-800">
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
        ))}
      </div>
    </div>
  );
}
