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
        <div key={day} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-zinc-100">{day}</span>
            <div className="flex-1 h-px bg-zinc-900"></div>
          </div>
          
          <div className="space-y-2">
            {dayLogs.map((log) => {
              if (log.type === 'fasting') {
                const nextLog = logs.find(l => l.type === 'fasting' && l.timestamp > log.timestamp);
                const isFasting = !log.data.isEating;
                const typeLabel = isFasting ? 'Fasting' : 'Eating';
                const durationStr = nextLog 
                    ? `(+${getDuration(new Date(log.timestamp), new Date(nextLog.timestamp))})`
                    : '(ongoing)';

                return (
                  <div key={log.id} className="flex flex-col gap-2 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl ${isFasting ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Utensils className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-bold">{typeLabel} {durationStr}</span>
                          <span className="text-xs font-mono text-zinc-500">{format(new Date(log.timestamp), 'HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                    {log.data.note && (
                      <div className="ml-14 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/30">
                        <p className="text-sm italic text-zinc-400 leading-relaxed font-medium whitespace-pre-line">
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
                  <div key={log.id} className="flex items-start gap-4 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold">Workout: {durationStr}</span>
                        <span className="text-xs font-mono text-zinc-500">{format(new Date(log.timestamp), 'HH:mm')}</span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 font-bold uppercase tracking-wider">
                        {log.data.muscleGroups?.join(', ') || 'General'}
                      </div>
                    </div>
                  </div>
                );
              }

              if (log.type === 'weight') {
                return (
                  <div key={log.id} className="flex flex-col gap-3 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <Scale className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <span className="text-base font-bold">Weight: {log.data.value} kg</span>
                            <span className="text-xs font-mono text-zinc-500">{format(new Date(log.timestamp), 'HH:mm')}</span>
                        </div>
                        </div>
                    </div>
                    {log.data.photos && log.data.photos.length > 0 && (
                        <div className="flex gap-2 ml-14">
                            {log.data.photos.map((photo: Blob, idx: number) => (
                                <div 
                                    key={idx} 
                                    className="w-20 h-20 rounded-xl overflow-hidden border border-zinc-800 shadow-lg active:scale-95 transition-transform cursor-pointer"
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

