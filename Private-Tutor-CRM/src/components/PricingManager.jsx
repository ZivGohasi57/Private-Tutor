import { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';

const DEFAULT_RATES = {
  elementary: 120,
  middle_school: 140,
  high_school: 160,
  academic: 200,
  academic_extra: 150
};

const RATE_LABELS = [
  { key: 'elementary', label: 'יסודי', section: 'regular' },
  { key: 'middle_school', label: 'חטיבת ביניים', section: 'regular' },
  { key: 'high_school', label: 'תיכון', section: 'regular' },
  { key: 'academic', label: 'שעה ראשונה (אקדמי)', section: 'academic' },
  { key: 'academic_extra', label: 'שעות נוספות (אקדמי)', section: 'academic' },
];

export function PricingManager({ onClose, onUpdate }) {
  const [rates, setRates] = useState(DEFAULT_RATES);

  useEffect(() => {
    const saved = localStorage.getItem('user_rates');
    if (saved) setRates(JSON.parse(saved));
  }, []);

  const handleChange = (key, value) => {
    setRates(prev => ({ ...prev, [key]: Number(value) }));
  };

  const handleSave = () => {
    localStorage.setItem('user_rates', JSON.stringify(rates));
    if (onUpdate) onUpdate(rates);
    onClose();
  };

  const handleReset = () => {
    if (confirm('לאפס לתעריפי ברירת המחדל?')) {
      setRates(DEFAULT_RATES);
    }
  };

  const regularRates = RATE_LABELS.filter(r => r.section === 'regular');
  const academicRates = RATE_LABELS.filter(r => r.section === 'academic');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">

        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">תעריפי שיעורים</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          <div className="space-y-3">
            {regularRates.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={rates[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full p-3 pr-4 pl-10 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                  />
                  <span className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 font-bold">₪</span>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">תמחור אקדמי</p>
            {academicRates.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={rates[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full p-3 pr-4 pl-10 border border-indigo-200 dark:border-indigo-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all"
                  />
                  <span className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 font-bold">₪</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl flex gap-3">
          <button
            onClick={handleReset}
            className="p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={18} /> שמור תעריפים
          </button>
        </div>

      </div>
    </div>
  );
}
