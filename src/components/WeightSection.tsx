import { useState } from 'react';
import { db } from '../db/db';
import { Scale, Camera, X } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';

interface WeightSectionProps {
  onUpdate: () => void;
}

export default function WeightSection({ onUpdate }: WeightSectionProps) {
  const [weight, setWeight] = useState<string>('');
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 3 - photos.length);
      const newBlobs = [...photos, ...filesArray];
      setPhotos(newBlobs);
      
      const newUrls = filesArray.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!weight) return;

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Check if entry exists for today
    const existingEntry = await db.logs
      .where('type').equals('weight')
      .filter(log => {
        const d = new Date(log.timestamp);
        return d >= todayStart && d <= todayEnd;
      })
      .first();

    if (existingEntry) {
      await db.logs.update(existingEntry.id!, {
        data: { value: parseFloat(weight), photos }
      });
    } else {
      await db.logs.add({
        type: 'weight',
        timestamp: today,
        data: { value: parseFloat(weight), photos }
      });
    }

    setWeight('');
    setPhotos([]);
    setPreviewUrls([]);
    onUpdate();
  };

  return (
    <div className="card border-l-4 border-l-emerald-500">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-5 h-5 text-emerald-500" />
        <h2 className="font-bold text-lg">Weight & Progress</h2>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="78.5"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl h-20 px-6 pt-5 text-3xl font-black focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 font-black uppercase text-base">kg</span>
          </div>

          <label className="w-20 h-20 bg-zinc-800 border-2 border-dashed border-zinc-700 rounded-2xl flex items-center justify-center active:bg-zinc-700 cursor-pointer shadow-inner">
            <Camera className="w-8 h-8 text-zinc-500" />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>

        {previewUrls.length > 0 && (
          <div className="flex gap-2">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden group shadow-lg">
                <img src={url} alt="Progress" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1 shadow-md"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSave}
          className="btn-large bg-emerald-500 text-white active:bg-emerald-600 shadow-lg shadow-emerald-500/20"
        >
          <Scale className="w-8 h-8 mr-2" />
          Add Weight
        </button>
      </div>
    </div>
  );
}
