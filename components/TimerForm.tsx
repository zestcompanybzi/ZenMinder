
import React, { useState } from 'react';

interface TimerFormProps {
  onAdd: (label: string, seconds: number, soundId: string) => void;
}

const PRESETS = [
  { label: 'Egg', seconds: 360 },
  { label: 'Pasta', seconds: 600 },
  { label: 'Focus', seconds: 1500 },
];

const TimerForm: React.FC<TimerFormProps> = ({ onAdd }) => {
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('1');
  const [seconds, setSeconds] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseInt(minutes) * 60 + parseInt(seconds);
    if (total > 0) {
      onAdd(label || 'New Timer', total, 'zen-bell');
      setLabel('');
      setMinutes('1');
      setSeconds('0');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <i className="fa-solid fa-plus-circle text-indigo-600"></i>
        Quick Start
      </h2>
      
      <div className="flex flex-wrap gap-2 mb-8">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onAdd(preset.label, preset.seconds, 'zen-bell')}
            className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-medium"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Timer Name</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Baking"
            className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-indigo-600 focus:bg-white outline-none transition-all"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            min="0"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-indigo-600 focus:bg-white outline-none"
            placeholder="Min"
          />
          <input
            type="number"
            min="0"
            max="59"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-indigo-600 focus:bg-white outline-none"
            placeholder="Sec"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg"
        >
          Create Timer
        </button>
      </form>
    </div>
  );
};

export default TimerForm;
