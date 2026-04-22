import { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

const METHODS = [
  { id: 'bit',      label: 'Bit',     active: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-300' },
  { id: 'paybox',   label: 'PayBox',  active: 'bg-violet-100 dark:bg-violet-900/30 border-violet-400 text-violet-700 dark:text-violet-300' },
  { id: 'cash',     label: 'מזומן / העברה', active: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300' },
];

export function PaymentForm({ students, onClose, onSave }) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bit');

  const handleStudentChange = (id) => {
    setSelectedStudentId(id);
    const student = students.find(s => s.id === id);
    setAmount(student?.balance < 0 ? Math.abs(student.balance).toString() : '');
  };

  const handleSubmit = () => {
    if (!amount || !selectedStudentId) return;
    onSave({ studentId: selectedStudentId, amount: Number(amount), method, date: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl relative border border-slate-100 dark:border-slate-800">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CreditCard size={22} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">קבלת תשלום</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">תלמיד משלם</label>
            <select
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              value={selectedStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} (יתרה: {s.balance}₪)</option>
              ))}
            </select>
          </div>

          <Input label="סכום לתשלום" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">איך שולם?</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(({ id, label, active }) => (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  className={`py-3 rounded-xl border font-bold text-sm transition-all ${
                    method === id
                      ? `${active} shadow-sm`
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none w-full py-3.5">
            אשר תשלום
          </Button>
        </div>
      </div>
    </div>
  );
}
