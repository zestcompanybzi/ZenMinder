
import React, { useState } from 'react';
import { processNaturalLanguage } from '../services/geminiService';

interface AIInputProps {
  onAddTimer: (label: string, seconds: number) => void;
}

const AIInput: React.FC<AIInputProps> = ({ onAddTimer }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setResponseMsg('');
    try {
      const res = await processNaturalLanguage(input);
      setResponseMsg(res.message);
      if (res.action === 'START_SESSION' && res.minutes > 0) {
        onAddTimer('Mindful Meal', res.minutes * 60);
        setInput('');
      }
    } catch (err) {
      setResponseMsg("I'm having trouble connecting. Let's focus on chewing!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <form onSubmit={handleAISubmit} className="relative z-10">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          {loading ? (
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <i className="fa-solid fa-wand-magic-sparkles text-emerald-500 text-lg"></i>
          )}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask ZenAI: 'Start 15 min lunch'..."
          className="w-full pl-16 pr-28 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 focus:border-emerald-400 focus:shadow-emerald-200/20 outline-none transition-all text-slate-700 font-medium text-base"
          disabled={loading}
        />
        <button
          type="submit"
          className="absolute right-3 top-3 bottom-3 px-8 bg-slate-800 text-white rounded-full font-black text-sm hover:bg-slate-900 transition-all flex items-center justify-center group-active:scale-95"
          disabled={loading}
        >
          {loading ? '...' : 'Ask'}
        </button>
      </form>
      
      {responseMsg && (
        <div className="mt-4 p-6 bg-white border border-emerald-100 rounded-[2rem] shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex gap-4">
             <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                <i className="fa-solid fa-robot text-emerald-600"></i>
             </div>
             <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">ZenAI Assistant</span>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{responseMsg}</p>
             </div>
          </div>
          <button 
            onClick={() => setResponseMsg('')}
            className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default AIInput;
