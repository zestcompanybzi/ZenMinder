
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EatingSession, SessionStatus, SessionHistoryEntry } from './types';
import BiteDisplay from './components/BiteDisplay';
import { SoundService } from './services/SoundService';

const App: React.FC = () => {
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [targetBiteSeconds, setTargetBiteSeconds] = useState(60);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);

  const [session, setSession] = useState<EatingSession>({
    totalMinutes: 60,
    remainingSeconds: 3600,
    currentBiteSeconds: 60,
    biteDurationSeconds: 60,
    status: SessionStatus.IDLE,
    completedBites: 0,
    soundId: 'zen-bell'
  });
  
  const startTimeRef = useRef<number | null>(null);
  const secondsAtStartRef = useRef<number>(3600);
  const intervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const lastBeepedMinuteRef = useRef<number>(0);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zen_minder_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    
    // Load preferences
    const savedBite = localStorage.getItem('zen_minder_bite_duration');
    if (savedBite) setTargetBiteSeconds(parseInt(savedBite));
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('zen_minder_history', JSON.stringify(history));
  }, [history]);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err: any) {
        console.warn("Wake Lock restricted.");
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  const addToHistory = useCallback((totalMins: number, completedBites: number, biteDur: number) => {
    if (completedBites <= 0) return;
    const newEntry: SessionHistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      totalMinutes: totalMins,
      completedBites: completedBites,
      biteDuration: biteDur
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 100));
  }, []);

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to delete all recent journeys? This cannot be undone.")) {
      setHistory([]);
      localStorage.removeItem('zen_minder_history');
    }
  };

  const downloadMonthlyHistory = () => {
    if (history.length === 0) return;

    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const monthlyData = history.filter(entry => entry.timestamp >= oneMonthAgo);

    if (monthlyData.length === 0) {
      alert("No history found for the last 30 days.");
      return;
    }

    const headers = ["Date", "Time", "Planned (Min)", "Completed Bites", "Bite Duration (Sec)", "Total Time (Sec)"];
    const rows = monthlyData.map(entry => {
      const d = new Date(entry.timestamp);
      const totalTimeSpent = entry.completedBites * entry.biteDuration;
      return [
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        entry.totalMinutes,
        entry.completedBites,
        entry.biteDuration,
        totalTimeSpent
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `zen-minder-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tick = useCallback(() => {
    if (session.status !== SessionStatus.RUNNING || !startTimeRef.current) return;

    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
    const newRemaining = Math.max(0, secondsAtStartRef.current - elapsed);
    
    const currentCompletedBites = Math.floor(elapsed / session.biteDurationSeconds);
    const nextBiteSecs = session.biteDurationSeconds - (elapsed % session.biteDurationSeconds);

    if (currentCompletedBites > lastBeepedMinuteRef.current && newRemaining > 0) {
      lastBeepedMinuteRef.current = currentCompletedBites;
      SoundService.play('zen-bell', 3);
    }

    if (newRemaining <= 0) {
      SoundService.play('zen-bell', 1);
      SoundService.stopKeepAlive();
      releaseWakeLock();
      
      addToHistory(session.totalMinutes, currentCompletedBites, session.biteDurationSeconds);

      setSession(prev => ({
        ...prev,
        remainingSeconds: 0,
        currentBiteSeconds: 0,
        status: SessionStatus.FINISHED,
        completedBites: currentCompletedBites
      }));
      return;
    }

    setSession(prev => ({
      ...prev,
      remainingSeconds: newRemaining,
      currentBiteSeconds: nextBiteSecs,
      completedBites: currentCompletedBites
    }));
  }, [session.status, session.totalMinutes, session.biteDurationSeconds, addToHistory]);

  useEffect(() => {
    if (session.status === SessionStatus.RUNNING) {
      intervalRef.current = window.setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session.status, tick]);

  const startNewSession = async (mins: number, biteSecs: number) => {
    await SoundService.unlock();
    await requestWakeLock();
    
    localStorage.setItem('zen_minder_bite_duration', biteSecs.toString());
    
    lastBeepedMinuteRef.current = 0;
    const totalSecs = mins * 60;
    startTimeRef.current = Date.now();
    secondsAtStartRef.current = totalSecs;

    setSession({
      totalMinutes: mins,
      remainingSeconds: totalSecs,
      currentBiteSeconds: biteSecs,
      biteDurationSeconds: biteSecs,
      status: SessionStatus.RUNNING,
      completedBites: 0,
      soundId: 'zen-bell'
    });
    setShowSettings(false);
  };

  const toggleSession = async () => {
    if (session.status === SessionStatus.RUNNING) {
      setSession(prev => ({ ...prev, status: SessionStatus.PAUSED }));
      SoundService.stopKeepAlive();
      releaseWakeLock();
    } else {
      await SoundService.unlock();
      await requestWakeLock();
      startTimeRef.current = Date.now();
      secondsAtStartRef.current = session.remainingSeconds;
      lastBeepedMinuteRef.current = 0;
      setSession(prev => ({ ...prev, status: SessionStatus.RUNNING }));
    }
  };

  const stopSession = () => {
    if (session.status === SessionStatus.RUNNING || session.status === SessionStatus.PAUSED) {
      const now = Date.now();
      const elapsed = Math.floor((now - (startTimeRef.current || now)) / 1000);
      const partialBites = Math.floor(elapsed / session.biteDurationSeconds) + (session.status === SessionStatus.PAUSED ? session.completedBites : 0);
      if (partialBites > 0) addToHistory(session.totalMinutes, partialBites, session.biteDurationSeconds);
    }

    startTimeRef.current = null;
    lastBeepedMinuteRef.current = 0;
    SoundService.stopKeepAlive();
    releaseWakeLock();
    setSession(prev => ({
      ...prev,
      status: SessionStatus.IDLE,
      remainingSeconds: prev.totalMinutes * 60,
      currentBiteSeconds: prev.biteDurationSeconds,
      completedBites: 0
    }));
  };

  const adjustMinutes = (delta: number) => {
    const newTarget = Math.max(1, Math.min(240, targetMinutes + delta));
    setTargetMinutes(newTarget);
    if (session.status === SessionStatus.IDLE) {
      setSession(prev => ({
        ...prev,
        totalMinutes: newTarget,
        remainingSeconds: newTarget * 60
      }));
    }
  };

  const adjustBiteSeconds = (delta: number) => {
    const newBite = Math.max(10, Math.min(180, targetBiteSeconds + delta));
    setTargetBiteSeconds(newBite);
    if (session.status === SessionStatus.IDLE) {
      setSession(prev => ({
        ...prev,
        biteDurationSeconds: newBite,
        currentBiteSeconds: newBite
      }));
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' at ' + 
           d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatTimeSpent = (bites: number, dur: number) => {
    const totalSecs = bites * dur;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full max-lg px-6 py-6 md:py-8 flex justify-between items-center max-w-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-bell text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">ZenMinder</h1>
        </div>
        <div className="flex gap-2">
          {session.status === SessionStatus.RUNNING && (
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
               Active
            </div>
          )}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showSettings ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}
          >
            <i className={`fa-solid ${showSettings ? 'fa-xmark' : 'fa-gear'}`}></i>
          </button>
        </div>
      </header>

      <main className="w-full max-w-lg px-6 flex-1 flex flex-col gap-6 pb-20">
        {showSettings ? (
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[80vh] custom-scrollbar">
            <h3 className="text-lg font-black text-slate-800">Settings</h3>
            
            <div className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Total Duration</label>
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => adjustMinutes(-5)} className="w-12 h-12 bg-white shadow-sm border rounded-xl flex items-center justify-center text-slate-600 active:scale-90"><i className="fa-solid fa-minus"></i></button>
                  <div>
                    <span className="text-4xl font-black text-indigo-600">{targetMinutes}</span>
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-tighter">Minutes</span>
                  </div>
                  <button onClick={() => adjustMinutes(5)} className="w-12 h-12 bg-white shadow-sm border rounded-xl flex items-center justify-center text-slate-600 active:scale-90"><i className="fa-solid fa-plus"></i></button>
                </div>
                <input type="range" min="1" max="240" value={targetMinutes} onChange={(e) => adjustMinutes(parseInt(e.target.value) - targetMinutes)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Beep Every</label>
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => adjustBiteSeconds(-5)} className="w-12 h-12 bg-white shadow-sm border rounded-xl flex items-center justify-center text-slate-600 active:scale-90"><i className="fa-solid fa-minus"></i></button>
                  <div>
                    <span className="text-4xl font-black text-emerald-600">{targetBiteSeconds}</span>
                    <span className="text-[10px] font-black text-slate-400 block uppercase tracking-tighter">Seconds</span>
                  </div>
                  <button onClick={() => adjustBiteSeconds(5)} className="w-12 h-12 bg-white shadow-sm border rounded-xl flex items-center justify-center text-slate-600 active:scale-90"><i className="fa-solid fa-plus"></i></button>
                </div>
                <input type="range" min="10" max="180" step="5" value={targetBiteSeconds} onChange={(e) => adjustBiteSeconds(parseInt(e.target.value) - targetBiteSeconds)} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
              </div>

              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-4">
                <i className="fa-solid fa-volume-high text-indigo-600"></i>
                <div>
                  <span className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest">Pulsing Tone</span>
                  <span className="text-sm font-bold text-slate-700">Zen Beep (Continuous)</span>
                </div>
              </div>
            </div>

            <button onClick={() => startNewSession(targetMinutes, targetBiteSeconds)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-black transition-all shadow-xl sticky bottom-0">
              Apply & Start
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <BiteDisplay session={session} onToggle={toggleSession} onStop={stopSession} />

            {session.status === SessionStatus.FINISHED && (
              <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] text-center shadow-xl animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-check text-2xl"></i>
                </div>
                <h3 className="text-xl font-black mb-1">Session Complete</h3>
                <p className="text-sm font-medium opacity-80">You completed {session.completedBites} intervals.</p>
                <button onClick={stopSession} className="mt-6 px-8 py-3 bg-white text-emerald-700 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all">Dismiss</button>
              </div>
            )}

            {session.status === SessionStatus.IDLE && (
              <div className="flex flex-col gap-6">
                <div className="text-center py-6 px-4">
                  <h2 className="text-xl font-black text-slate-800 mb-2">Minute Minder</h2>
                  <p className="text-slate-400 text-sm font-medium mb-8 max-w-[280px] mx-auto">
                    Continuous high-pitched beeps every {targetBiteSeconds}s. Volume optimized.
                  </p>
                  <button onClick={() => startNewSession(targetMinutes, targetBiteSeconds)} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all text-lg">
                    Start {targetMinutes} Min Session
                  </button>
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-800">Recent History</h3>
                    <div className="flex gap-4">
                      {history.length > 0 && (
                        <>
                          <button onClick={downloadMonthlyHistory} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors flex items-center gap-1">
                            <i className="fa-solid fa-download"></i> Export
                          </button>
                          <button onClick={clearHistory} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors">Clear All</button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {history.length === 0 ? (
                    <div className="py-12 text-center">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <i className="fa-solid fa-mountain-sun text-slate-300 text-xl"></i>
                       </div>
                       <p className="text-slate-400 text-sm font-medium italic">No recent session data.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {history.map((entry) => (
                        <div key={entry.id} className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between group hover:bg-white hover:border-emerald-200 transition-all">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-1">
                               <i className="fa-regular fa-calendar text-[10px] text-slate-400"></i>
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                 {formatDate(entry.timestamp)}
                               </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-700">{entry.completedBites} Beeps</span>
                              <span className="text-slate-300">•</span>
                              <div className="flex items-center gap-1">
                                 <i className="fa-regular fa-clock text-[10px] text-slate-400"></i>
                                 <span className="text-xs font-bold text-slate-500">{formatTimeSpent(entry.completedBites, entry.biteDuration || 60)} spent</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity ml-4">
                            <i className="fa-solid fa-check text-xs"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="w-full max-w-lg px-6 py-8 text-center mt-auto">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Zen Sound Engine Active</p>
      </footer>
    </div>
  );
};

export default App;
