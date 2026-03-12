import { useState, useEffect } from 'react';
import { db, type HealthLog } from '../db/db';
import { format, differenceInMinutes } from 'date-fns';
import { Utensils, Dumbbell, Scale } from 'lucide-react';
import PhotoModal from './PhotoModal';

interface TimelineProps {
  refreshTrigger: number;
}

export default function Timeline({ refreshTrigger }: TimelineProps) {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Blob | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const allLogs = await db.logs.orderBy('timestamp').reverse().toArray();
      setLogs(allLogs);
    };
    fetchLogs();
  }, [refreshTrigger]);

  const groupLogsByDay = () => {
    const groups: Record<string, HealthLog[]> = {};
    logs.slice(0, 10).forEach(log => { // Limit to recent logs for quick timeline
      const day = format(new Date(log.timestamp), 'yy.MM.dd');
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

  return (
    <div className="space-y-6">
      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
      {Object.entries(dayGroups).map(([day, dayLogs]) => (
        <div key={day} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black text-zinc-100">{day}</span>
            <div className="flex-1 h-px bg-zinc-800"></div>
          </div>
          
          <div className="space-y-3">
            {dayLogs.map((log) => {
              if (log.type === 'fasting') {
                const nextLog = logs.find(l => l.type === 'fasting' && l.timestamp > log.timestamp);
                const isFasting = !log.data.isEating;
                const typeLabel = isFasting ? 'Fasting' : 'Eating';
                const durationStr = nextLog 
                    ? `(+${getDuration(new Date(log.timestamp), new Date(nextLog.timestamp))})`
                    : '(ongoing)';

                return (
                  <div key={log.id} className="flex flex-col gap-3 p-5 bg-zinc-900/40 rounded-3xl border border-zinc-800/60 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${isFasting ? 'bg-orange-500/15 text-orange-500' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Utensils className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">{typeLabel} <span className="text-zinc-500 font-medium ml-1">{durationStr}</span></span>
                          <span className="text-sm font-mono text-zinc-500 font-bold">{format(new Date(log.timestamp), 'HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                    {log.data.note && (
                      <div className="ml-16 p-4 bg-zinc-800/40 rounded-2xl border border-zinc-700/20">
                        <p className="text-base italic text-zinc-300 leading-relaxed font-medium whitespace-pre-line">
                          "{log.data.note}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              }

              if (log.type === 'workout' && log.data.action === 'start') {
                const endLog = logs.find(l => l.type === 'workout' && l.data.action === 'end' && l.timestamp > log.timestamp);
                const durationStr = endLog 
                    ? getDuration(new Date(log.timestamp), new Date(endLog.timestamp))
                    : 'ongoing';

                return (
                  <div key={log.id} className="flex items-start gap-4 p-5 bg-zinc-900/40 rounded-3xl border border-zinc-800/60 shadow-sm">
                    <div className="p-3 rounded-2xl bg-blue-500/15 text-blue-500">
                      <Dumbbell className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Workout: <span className="text-blue-500 font-black">{durationStr}</span></span>
                        <span className="text-sm font-mono text-zinc-500 font-bold">{format(new Date(log.timestamp), 'HH:mm')}</span>
                      </div>
                      <div className="text-sm text-zinc-400 mt-2 font-black uppercase tracking-widest bg-zinc-800/50 inline-block px-2.5 py-1 rounded-lg">
                        {log.data.muscleGroups?.join(', ') || 'General'}
                      </div>
                    </div>
                  </div>
                );
              }

              if (log.type === 'weight') {
                return (
                  <div key={log.id} className="flex flex-col gap-4 p-5 bg-zinc-900/40 rounded-3xl border border-zinc-800/60 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-500">
                        <Scale className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Weight: <span className="text-emerald-500 font-black">{log.data.value} kg</span></span>
                            <span className="text-sm font-mono text-zinc-500 font-bold">{format(new Date(log.timestamp), 'HH:mm')}</span>
                        </div>
                        </div>
                    </div>
                    {log.data.photos && log.data.photos.length > 0 && (
                        <div className="flex gap-3 ml-16">
                            {log.data.photos.map((photo: Blob, idx: number) => (
                                <div 
                                    key={idx} 
                                    className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-700/50 shadow-md active:scale-95 transition-transform cursor-pointer"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <img 
                                        src={URL.createObjectURL(photo)} 
                                        alt="Progress" 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
