import { X, Calendar, Clock, MapPin, Video, Trash2, Pencil, Banknote } from 'lucide-react';
import { Button } from './Button';

export function LessonDetails({ lesson, onClose, onEdit, onDelete }) {
  if (!lesson) return null;

  const dateStr = new Date(lesson.start).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = new Date(lesson.start).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const endStr = lesson.end ? new Date(lesson.end).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '';

  const handleDelete = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק שיעור זה?')) {
      onDelete(lesson.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        <div className="p-4 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{lesson.studentName || lesson.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{lesson.type === 'block' ? 'חסימת לו"ז' : 'שיעור פרטי'}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs font-bold opacity-60">תאריך</p>
              <p className="font-bold">{dateStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold opacity-60">שעה</p>
              <p className="font-bold">{timeStr} - {endStr}</p>
            </div>
          </div>

          {lesson.type !== 'block' && (
            <>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <div className={`p-2.5 rounded-xl ${lesson.type === 'frontal' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'}`}>
                  {lesson.type === 'frontal' ? <MapPin size={20} /> : <Video size={20} />}
                </div>
                <div>
                  <p className="text-xs font-bold opacity-60">מיקום</p>
                  <p className="font-bold">
                    {lesson.type === 'frontal' ? (lesson.location || 'פרונטלי') : 'אונליין (Zoom)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Banknote size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold opacity-60">מחיר</p>
                  <p className="font-bold text-lg">₪{lesson.price}</p>
                </div>
              </div>
            </>
          )}

          <div className="pt-4 flex gap-3">
            <Button onClick={handleDelete} variant="danger" className="flex items-center justify-center gap-2">
              <Trash2 size={18} /> מחק
            </Button>
            <Button onClick={onEdit} className="flex items-center justify-center gap-2">
              <Pencil size={18} /> ערוך
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}