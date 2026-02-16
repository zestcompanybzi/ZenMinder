
import React, { useEffect, useRef } from 'react';
import { Timer, TimerStatus } from '../types';
import { SoundService } from '../services/SoundService';

interface TimerCardProps {
  timer: Timer;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
}

const TimerCard: React.FC<TimerCardProps> = ({ timer, onToggle, onReset, onDelete }) => {
  const lastStatus = useRef<TimerStatus>(timer.status);

  useEffect(() => {
    if (timer.status === TimerStatus.FINISHED && lastStatus.current !== TimerStatus.FINISHED) {
      SoundService.play(timer.soundId, 3);
    }
    lastStatus.current = timer.status;
  }, [timer.status, timer.soundId]);

  const handleReset = () => {
    onReset(timer.id);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = timer.remainingSeconds / timer.totalSeconds;
  const offset = circumference - (progress * circumference);

  const getStatusColor = () => {
    if (timer.status === TimerStatus.FINISHED) return 'text-rose-500 stroke-rose-500';
    if (timer.status === TimerStatus.PAUSED) return 'text-amber-500 stroke-amber-500';
    return 'text-indigo-600 stroke-indigo-600';
  };

  return (
    <div className={`relative bg-white rounded-3xl p-6 shadow-xl border border-slate-100 transition-all hover:shadow-2xl ${timer.status === TimerStatus.FINISHED ? 'animate-pulse ring-4 ring-rose-100' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 truncate max-w-[150px]">{timer.label}</h3>
          <p className="text-xs text-slate-400">Total: {formatTime(timer.totalSeconds)}</p>
        </div>
        <button 
          onClick={() => onDelete(timer.id)}
          className="text-slate-300 hover:text-rose-500 transition-colors"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div className="relative flex justify-center items-center py-4">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset }}
            strokeLinecap="round"
            className={`timer-ring transition-all duration-1000 ${getStatusColor()}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-mono font-bold ${getStatusColor()}`}>
            {formatTime(timer.remainingSeconds)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={() => onToggle(timer.id)}
          disabled={timer.status === TimerStatus.FINISHED}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            timer.status === TimerStatus.RUNNING 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          } disabled:opacity-50`}
        >
          {timer.status === TimerStatus.RUNNING ? (
            <><i className="fa-solid fa-pause"></i> Pause</>
          ) : (
            <><i className="fa-solid fa-play"></i> {timer.status === TimerStatus.PAUSED ? 'Resume' : 'Start'}</>
          )}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
          title="Reset"
        >
          <i className="fa-solid fa-rotate-left"></i>
        </button>
      </div>
      
      {timer.status === TimerStatus.FINISHED && (
        <div className="absolute inset-x-0 -bottom-4 flex justify-center">
          <span className="bg-rose-500 text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold shadow-lg">
            Time's Up!
          </span>
        </div>
      )}
    </div>
  );
};

export default TimerCard;
