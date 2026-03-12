import { useState, useEffect } from 'react';
import { db, getLastLog, type HealthLog } from '../db/db';
import { format } from 'date-fns';
import { Utensils } from 'lucide-react';

interface FastingSectionProps {
  onUpdate: () => void;
}

export default function FastingSection({ onUpdate }: FastingSectionProps) {
  const [lastLog, setLastLog] = useState<HealthLog | null>(null);
  const [elapsed, setElapsed] = useState<string>('00:00:00');
  const [eatingNote, setEatingNote] = useState<string>('');

  const fetchLastLog = async () => {
    const log = await getLastLog('fasting');
    setLastLog(log || null);
  };

  useEffect(() => {
    fetchLastLog();
  }, [onUpdate]);

  useEffect(() => {
    if (!lastLog) return;

    const interval = setInterval(() => {
      const diff = new Date().getTime() - new Date(lastLog.timestamp).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsed(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [lastLog]);

  const handleToggle = async () => {
    const isCurrentlyEating = lastLog?.data.isEating ?? false;
    
    // Clean up the note before saving
    const finalNote = eatingNote.trim().replace(/\n/g, ' | ');

    await db.logs.add({
      type: 'fasting',
      timestamp: new Date(),
      data: { 
        isEating: !isCurrentlyEating,
        note: isCurrentlyEating ? finalNote : undefined
      }
    });
    
    setEatingNote('');
    fetchLastLog();
    onUpdate();
  };

  const isEating = lastLog?.data.isEating ?? false;

  return (
    <div className="card border-l-4 border-l-orange-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-lg">Fasting</h2>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs uppercase tracking-tighter text-zinc-500 font-bold">
            {isEating ? 'Eating for' : 'Fasting for'}
          </span>
          <span className="font-mono text-3xl font-bold tabular-nums">
            {elapsed}
          </span>
        </div>
      </div>

      {isEating && (
        <div className="mb-4">
          <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-widest">
            What are you eating? (2 sentences max)
          </label>
          <textarea
            value={eatingNote}
            onChange={(e) => setEatingNote(e.target.value)}
            placeholder="e.g., Chicken breast and salad. Low carb meal."
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600 resize-none"
          />
        </div>
      )}

      <button
        onClick={handleToggle}
        className={`btn-large ${
          isEating 
            ? 'bg-zinc-100 text-zinc-950 active:bg-zinc-300' 
            : 'bg-orange-500 text-white active:bg-orange-600'
        }`}
      >
        <Utensils className="w-6 h-6 mr-2" />
        {isEating ? '먹었음 (Stop Eating)' : '먹었음 (Start Eating)'}
      </button>
      
      <p className="text-sm text-center mt-3 text-zinc-500 font-medium">
        Last event: {lastLog ? format(new Date(lastLog.timestamp), 'HH:mm:ss') : 'None'}
      </p>
    </div>
  );
}
