import { X } from 'lucide-react';

interface PhotoModalProps {
  photo: Blob;
  onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: PhotoModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4" onClick={onClose}>
      <button 
        className="absolute top-8 right-6 p-2 bg-zinc-800 rounded-full text-zinc-100 active:scale-90 transition-transform"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="w-8 h-8" />
      </button>
      
      <div className="w-full max-w-lg aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border border-zinc-800" onClick={(e) => e.stopPropagation()}>
        <img 
          src={URL.createObjectURL(photo)} 
          alt="Progress Large" 
          className="w-full h-full object-contain bg-zinc-900" 
        />
      </div>
      
      <p className="mt-6 text-zinc-500 font-bold uppercase tracking-widest text-sm">
        Swipe or Click X to close
      </p>
    </div>
  );
}
