
import React from 'react';
import { EatingSession, SessionStatus } from '../types';

interface BiteDisplayProps {
  session: EatingSession;
  onToggle: () => void;
  onStop: () => void;
}

const BiteDisplay: React.FC<BiteDisplayProps> = ({ session, onToggle, onStop }) => {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const biteProgress = (session.biteDurationSeconds - session.currentBiteSeconds) / session.biteDurationSeconds;
  const offset = circumference - (biteProgress * circumference);

  const totalSeconds = session.totalMinutes * 60;
  const overallProgress = ((totalSeconds - session.remainingSeconds) / totalSeconds) * 100;
  const isRunning = session.status === SessionStatus.RUNNING;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 text-center relative overflow-hidden">
      {/* Overall Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50">
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      <div className="mb-8 mt-2">
        <div className="relative inline-flex items-center justify-center">
          {isRunning && (
            <div className="absolute inset-0 rounded-full bg-emerald-400/5 animate-pulse-soft scale-125"></div>
          )}
          
          <svg className="w-56 h-56 md:w-64 md:h-64 transform -rotate-90">
            <circle 
              cx="50%" 
              cy="50%" 
              r={radius} 
              stroke="currentColor" 
              strokeWidth="8" 
              fill="transparent" 
              className="text-slate-50" 
            />
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              style={{ strokeDashoffset: offset }}
              strokeLinecap="round"
              className={`text-emerald-500 transition-all duration-1000 ease-linear ${isRunning ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]' : ''}`}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">
                {session.currentBiteSeconds}
            </span>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1">Seconds Left</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50/50 p-4 rounded-2xl">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bites</span>
          <span className="text-2xl font-black text-slate-800">{session.completedBites}</span>
        </div>
        <div className="bg-slate-50/50 p-4 rounded-2xl">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Clock</span>
          <span className="text-2xl font-black text-slate-800 font-mono">{formatTime(session.remainingSeconds)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onToggle}
          className={`flex-[3] py-5 rounded-2xl font-black text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
            isRunning 
            ? 'bg-slate-800 text-white' 
            : 'bg-emerald-600 text-white'
          }`}
        >
          <i className={`fa-solid ${isRunning ? 'fa-pause' : 'fa-play'}`}></i>
          {isRunning ? 'Pause' : session.status === SessionStatus.PAUSED ? 'Resume' : 'Start Meal'}
        </button>
        <button
          onClick={onStop}
          className="flex-1 py-5 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center"
        >
          <i className="fa-solid fa-stop"></i>
        </button>
      </div>
    </div>
  );
};

export default BiteDisplay;
