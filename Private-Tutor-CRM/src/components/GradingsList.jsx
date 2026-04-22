import { BookOpen, Calendar, Trash2, Pencil, CheckCircle2, Banknote } from 'lucide-react';

export function GradingsList({ gradings, onEdit, onDelete }) {
  
  if (!gradings || gradings.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in">
        <div className="bg-slate-50 dark:bg-slate-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
          <BookOpen className="text-slate-400 dark:text-slate-500" size={32} />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">אין נתונים החודש</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">כאן יופיעו המשכורות והבדיקות שלך.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20 animate-in slide-in-from-bottom-2">
      {gradings.map((item) => {
        const date = new Date(item.date).toLocaleDateString('he-IL');
        const isSalary = item.type === 'salary';

        return (
          <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex justify-between items-center group hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
            
            <div className="flex items-center gap-4">
              <div className={`${isSalary ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'} w-12 h-12 rounded-full flex items-center justify-center shrink-0`}>
                 {isSalary ? <Banknote size={20}/> : <CheckCircle2 size={20} />}
              </div>
              
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{item.courseName}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.taskName || 'ללא פירוט'}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={10}/> {date}</span>
                  {!isSalary && (
                    <>
                      <span>•</span>
                      <span>{item.taskCount} יחידות</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`font-bold text-lg ${isSalary ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-600 dark:text-violet-400'}`}>₪{item.totalPrice.toLocaleString()}</span>
              
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(item)} className="p-1.5 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Pencil size={16} /></button>
                <button onClick={() => onDelete(item.id)} className="p-1.5 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}