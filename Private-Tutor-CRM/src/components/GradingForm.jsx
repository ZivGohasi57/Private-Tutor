import { useState, useEffect } from 'react';
import { X, Check, Settings, Loader2, CalendarClock } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { getCourses } from '../lib/storage';
import { CoursesManager } from './CoursesManager';

export function GradingForm({ onClose, onSave, initialData }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [taskName, setTaskName] = useState(initialData?.taskName || '');
  const [taskCount, setTaskCount] = useState(initialData?.taskCount || 1);
  const [pricePerTask, setPricePerTask] = useState(initialData?.pricePerTask || '');
  const [targetMonth, setTargetMonth] = useState('current');
  const [loading, setLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [isManaging]);

  const loadCourses = async () => {
    const data = await getCourses();
    setCourses(data);
    if (initialData) {
      const match = data.find(c => c.name === initialData.courseName);
      if (match) setSelectedCourseId(match.id);
    }
    setLoading(false);
  };

  const handleCourseChange = (id) => {
    setSelectedCourseId(id);
    const course = courses.find(c => c.id === id);
    if (course) setPricePerTask(course.defaultPrice);
  };

  const handleSubmit = () => {
    const course = courses.find(c => c.id === selectedCourseId);
    const finalCourseName = course ? course.name : (initialData?.courseName || '');
    if (!finalCourseName && !selectedCourseId) return;

    let dateToSave = new Date();
    if (targetMonth === 'next') {
      dateToSave = new Date(dateToSave.getFullYear(), dateToSave.getMonth() + 1, 1);
    } else if (initialData) {
      dateToSave = new Date(initialData.date);
    }

    const dataToSave = {
      type: 'task',
      date: dateToSave.toISOString(),
      courseName: finalCourseName,
      taskName: taskName || 'ללא שם',
      taskCount: Number(taskCount),
      pricePerTask: Number(pricePerTask),
      totalPrice: Number(taskCount) * Number(pricePerTask),
    };

    if (initialData?.id) dataToSave.id = initialData.id;
    onSave(dataToSave);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4" dir="rtl">
        <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-3xl shadow-2xl relative max-h-[85vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>

          <h2 className="text-xl font-black mb-6 text-center text-slate-900 dark:text-white">
            {initialData ? 'עריכת דיווח' : 'דיווח הכנסה'}
          </h2>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl flex items-center justify-between border border-blue-100 dark:border-blue-900/40">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <CalendarClock size={14}/> חודש לחיוב
              </span>
              <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 border border-blue-100 dark:border-slate-700 gap-1">
                <button onClick={() => setTargetMonth('current')} className={`px-3 py-1 text-xs rounded-lg transition-all font-bold ${targetMonth === 'current' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>הנוכחי</button>
                <button onClick={() => setTargetMonth('next')} className={`px-3 py-1 text-xs rounded-lg transition-all font-bold ${targetMonth === 'next' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>הבא</button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">קורס / מקור הכנסה</label>
                <button onClick={() => setIsManaging(true)} className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  <Settings size={12}/> נהל רשימה
                </button>
              </div>
              {loading
                ? <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center"><Loader2 className="animate-spin mx-auto text-slate-400" size={20}/></div>
                : (
                  <select
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                  >
                    <option value="">{initialData ? initialData.courseName : '-- בחר --'}</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )
              }
            </div>

            <div className="space-y-4">
              <Input label="שם המטלה" placeholder='למשל: "מטלה 3"' value={taskName} onChange={(e) => setTaskName(e.target.value)} />
              <div className="flex gap-4">
                <div className="flex-1"><Input type="number" label="כמות" value={taskCount} onChange={(e) => setTaskCount(e.target.value)} /></div>
                <div className="flex-[1.5]"><Input type="number" label="מחיר ליחידה" value={pricePerTask} onChange={(e) => setPricePerTask(e.target.value)} /></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border flex justify-between items-center bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/40">
              <span className="text-sm font-bold text-violet-900 dark:text-violet-300">סה"כ לתשלום:</span>
              <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
                ₪{(Number(taskCount) * Number(pricePerTask)) || 0}
              </span>
            </div>

            <Button onClick={handleSubmit} className="bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200 dark:shadow-none w-full">
              <Check size={18} className="mr-2"/> שמור דיווח
            </Button>
          </div>
        </div>
      </div>
      {isManaging && <CoursesManager onClose={() => setIsManaging(false)} />}
    </>
  );
}
