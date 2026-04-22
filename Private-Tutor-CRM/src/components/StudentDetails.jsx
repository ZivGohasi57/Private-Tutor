import { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, Clock, Loader2, Trash2 } from 'lucide-react';
import { getStudentHistory, deleteLesson, deletePayment } from '../lib/storage';

export function StudentDetails({ student, onClose, onEditLesson }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [student]);

  const loadData = async () => {
    if (student?.id) {
      const data = await getStudentHistory(student.id);
      setHistory(data);
    }
    setLoading(false);
  };

  const handleDeleteItem = async (item) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הפריט הזה? היתרה תעודכן בהתאם.')) return;
    
    setLoading(true);
    if (item.dataType === 'lesson') {
      await deleteLesson(item.id);
    } else {
      await deletePayment(item.id);
    }
    await loadData(); 
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" dir="rtl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full shadow-2xl animate-in slide-in-from-right p-4 overflow-y-auto border-l dark:border-slate-800">
        
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{student.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{student.level} • כרטיס תלמיד</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm text-center border mb-6 ${
          student.balance < 0 
            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50' 
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50'
        }`}>
          <p className="text-slate-500 dark:text-slate-400 mb-1 font-bold text-xs">יתרה נוכחית</p>
          <p className={`text-4xl font-black ${student.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} dir="ltr">
            {student.balance} ₪
          </p>
          {student.balance < 0 && <p className="text-xs text-rose-500 dark:text-rose-400 mt-2 font-bold">התלמיד בחוב</p>}
        </div>

        <div>
          <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2 text-sm">
            <Clock size={16} />
            פעילות אחרונה
          </h3>
          
          {loading ? (
             <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-indigo-500"/></div>
          ) : (
             <div className="space-y-3">
               {history.length === 0 ? (
                 <p className="text-center text-slate-400 py-4 text-sm">אין פעילות רשומה</p>
               ) : (
                 history.map((item) => {
                   const isLesson = item.dataType === 'lesson';
                   return (
                     <div 
                        key={item.id} 
                        className={`bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex justify-between items-center transition-all group ${isLesson ? 'hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer' : ''}`}
                        onClick={() => isLesson && onEditLesson && onEditLesson(item)}
                     >
                       <div className="flex gap-3 items-center flex-1">
                         <div className={`p-2.5 rounded-xl ${isLesson ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                           {isLesson ? <Calendar size={18} /> : <CreditCard size={18} />}
                         </div>
                         <div>
                           <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                             {isLesson ? (item.title || 'שיעור פרטי') : 'התקבל תשלום'}
                           </p>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                             {new Date(item.start || item.date).toLocaleDateString('he-IL')} 
                             {isLesson ? ` • ₪${item.price}` : ` • ${item.method || 'מזומן'}`}
                           </p>
                         </div>
                       </div>

                       <div className="flex items-center gap-3">
                          <div className={`font-mono font-bold text-sm ${isLesson ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {isLesson ? (
                                  new Date(item.start) < new Date() ? `-${item.price}₪` : <span className="text-slate-400 text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">עתידי</span>
                              ) : (
                                  `+${item.amount}₪`
                              )}
                          </div>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteItem(item); }}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            title="מחק שורה"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}