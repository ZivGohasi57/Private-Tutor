import { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { getCourses, saveCourse, deleteCourse } from '../lib/storage';

export function CoursesManager({ onClose }) {
  const [courses, setCourses] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newPrice) return;
    await saveCourse({ name: newName, defaultPrice: Number(newPrice) });
    setNewName('');
    setNewPrice('');
    loadCourses();
  };

  const handleDelete = async (id) => {
    if (confirm('למחוק את הקורס מהרשימה?')) {
      await deleteCourse(id);
      loadCourses();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in p-4" dir="rtl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-2xl shadow-xl relative max-h-[85vh] overflow-y-auto border border-slate-100 dark:border-slate-800">
        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-center text-slate-800 dark:text-white">ניהול קורסים</h2>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
           <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">הוסף קורס חדש לרשימה:</p>
           <Input placeholder="שם הקורס (למשל: אלגוריתמים)" value={newName} onChange={e => setNewName(e.target.value)} />
           <div className="flex gap-2 mt-2">
              <Input type="number" placeholder="מחיר ברירת מחדל" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
              <Button onClick={handleAdd} className="w-auto px-4"><Plus size={20}/></Button>
           </div>
        </div>

        <div className="space-y-2">
           {courses.length === 0 && !loading && <p className="text-center text-slate-400 text-sm">אין קורסים ברשימה עדיין.</p>}
           
           {courses.map(c => (
             <div key={c.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full text-blue-600 dark:text-blue-400"><BookOpen size={16}/></div>
                   <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">₪{c.defaultPrice} למטלה</p>
                   </div>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-2 transition-colors">
                  <Trash2 size={16}/>
                </button>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}