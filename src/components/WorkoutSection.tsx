import { useState, useEffect } from 'react';
import { db, getLastLog } from '../db/db';
import { Dumbbell, X } from 'lucide-react';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Cardio'];

interface WorkoutSectionProps {
  onUpdate: () => void;
}

export default function WorkoutSection({ onUpdate }: WorkoutSectionProps) {
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [isWorkingOut, setIsWorkingOut] = useState(false);

  const fetchLastLog = async () => {
    const log = await getLastLog('workout');
    setIsWorkingOut(log?.data.action === 'start');
    if (log?.data.action === 'start') {
        setSelectedMuscles(log?.data.muscleGroups || []);
    }
  };

  useEffect(() => {
    fetchLastLog();
  }, [onUpdate]);

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles(prev => 
      prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]
    );
  };

  const handleStart = async () => {
    await db.logs.add({
      type: 'workout',
      timestamp: new Date(),
      data: { action: 'start', muscleGroups: selectedMuscles }
    });
    onUpdate();
  };

  const handleEnd = async () => {
    await db.logs.add({
      type: 'workout',
      timestamp: new Date(),
      data: { action: 'end', muscleGroups: selectedMuscles }
    });
    setSelectedMuscles([]);
    onUpdate();
  };

  return (
    <div className="card border-l-4 border-l-blue-500">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="w-5 h-5 text-blue-500" />
        <h2 className="font-bold text-lg">Workout</h2>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map(muscle => (
            <button
              key={muscle}
              onClick={() => toggleMuscle(muscle)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                selectedMuscles.includes(muscle)
                  ? 'bg-blue-500 text-white border border-blue-400'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {muscle}
            </button>
          ))}
        </div>

        {!isWorkingOut ? (
          <button
            onClick={handleStart}
            className="btn-large bg-blue-500 text-white active:bg-blue-600 shadow-lg shadow-blue-500/20"
          >
            <Dumbbell className="w-6 h-6 mr-2" />
            운동 시작 (Start Workout)
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-1 p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <span className="text-[10px] uppercase font-black text-blue-500 tracking-widest">Active Focus</span>
              <span className="text-base font-bold text-zinc-200">
                {selectedMuscles.join(', ') || 'General Training'}
              </span>
            </div>
            <button
              onClick={handleEnd}
              className="btn-large bg-zinc-100 text-zinc-950 active:bg-zinc-300"
            >
              <X className="w-6 h-6 mr-2" />
              운동 종료 (End Workout)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
