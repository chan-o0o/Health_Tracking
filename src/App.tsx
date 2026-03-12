import { useState } from 'react';
import FastingSection from './components/FastingSection';
import WorkoutSection from './components/WorkoutSection';
import WeightSection from './components/WeightSection';
import Timeline from './components/Timeline';
import HistorySection from './components/HistorySection';
import { Layout, History as HistoryIcon, Home } from 'lucide-react';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 pt-12 pb-24" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)' }}>
      <header className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter">
          {activeTab === 'today' ? 'HEALTH TRACKER' : 'HISTORY'}
        </h1>
      </header>

      <main className="space-y-8">
        {activeTab === 'today' ? (
          <>
            <FastingSection onUpdate={triggerRefresh} />
            <WorkoutSection onUpdate={triggerRefresh} />
            <WeightSection onUpdate={triggerRefresh} />
            
            <div className="pt-4 border-t border-zinc-900">
              <h2 className="text-base font-bold text-zinc-500 uppercase tracking-widest mb-4">Quick Timeline</h2>
              <Timeline refreshTrigger={refreshTrigger} />
            </div>
          </>
        ) : (
          <HistorySection refreshTrigger={refreshTrigger} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-900 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex justify-around items-center z-50 max-w-md mx-auto">
        <button 
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'today' ? 'text-zinc-100' : 'text-zinc-600'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Today</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-zinc-100' : 'text-zinc-600'}`}
        >
          <HistoryIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
