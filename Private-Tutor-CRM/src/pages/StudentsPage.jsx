import { useState, useEffect, useMemo } from 'react';
import {
  CalendarPlus, CreditCard, TrendingUp, Calendar as CalendarIcon,
  Users, LogOut, Trash2, Pencil, BookOpen, PieChart,
  Settings, MapPin, Video, Home, ChevronLeft,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import {
  listenToStudents, listenToSchedule, listenToGradings,
  saveStudent, saveBulkLessons, updateLesson,
  savePayment, saveGrading, deleteGrading, deleteStudent,
  deleteLesson, getMonthlyStats,
} from '../lib/storage';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LessonForm } from '../components/LessonForm';
import { PaymentForm } from '../components/PaymentForm';
import { GradingForm } from '../components/GradingForm';
import { GradingsList } from '../components/GradingsList';
import { StudentDetails } from '../components/StudentDetails';
import { CalendarView } from '../components/CalendarView';
import { LessonDetails } from '../components/LessonDetails';
import StatsPage from './StatsPage';
import { LEVELS, LEVEL_LABELS } from '../lib/pricing';
import { PricingManager } from '../components/PricingManager';

const TABS = [
  { id: 'students', label: 'בית',     icon: Home },
  { id: 'calendar', label: 'לו"ז',    icon: CalendarIcon },
  { id: 'gradings', label: 'בדיקות',  icon: BookOpen },
  { id: 'stats',    label: 'דוחות',   icon: PieChart },
];

const LEVEL_AVATAR = {
  academic:   'bg-gradient-to-br from-violet-500 to-indigo-600',
  high:       'bg-gradient-to-br from-emerald-400 to-teal-600',
  middle:     'bg-gradient-to-br from-amber-400 to-orange-500',
  elementary: 'bg-gradient-to-br from-slate-400 to-slate-600',
};

const LEVEL_BADGE = {
  academic:   'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  high:       'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  middle:     'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  elementary: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400',
};

export default function StudentsPage() {
  const [view, setView] = useState('students');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [gradings, setGradings] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({ total: 0 });

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isReportingLesson, setIsReportingLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [viewLesson, setViewLesson] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [editingGrading, setEditingGrading] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState(LEVELS.HIGH);

  useEffect(() => {
    const unsubStudents = listenToStudents((data) => { setStudents(data); setLoading(false); });
    const unsubSchedule = listenToSchedule(setSchedule);
    const unsubGradings = listenToGradings(setGradings);
    loadPaymentStats();
    return () => { unsubStudents(); unsubSchedule(); unsubGradings(); };
  }, []);

  const loadPaymentStats = async () => {
    try { setMonthlyStats(await getMonthlyStats()); } catch (e) { console.error(e); }
  };

  const futureIncome = useMemo(() => {
    const now = new Date();
    return schedule
      .filter(l => {
        const start = l.start?.toDate ? l.start.toDate() : new Date(l.start);
        return start >= now && l.price && l.type !== 'block';
      })
      .reduce((sum, l) => sum + Number(l.price), 0);
  }, [schedule]);

  const handleAddStudent = async () => {
    if (!newName.trim()) return;
    await saveStudent({ name: newName, level: newLevel, balance: 0 });
    setNewName('');
    setIsAddingStudent(false);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent?.name.trim()) return;
    await saveStudent(editingStudent);
    setEditingStudent(null);
  };

  const handleDeleteStudent = async (id) => {
    if (confirm('בטוח למחוק את התלמיד?')) await deleteStudent(id);
  };

  const handleSaveLesson = async (data) => {
    if (Array.isArray(data)) await saveBulkLessons(data);
    else if (data.id) await updateLesson(data);
    else await saveBulkLessons([data]);
    setIsReportingLesson(false);
    setEditingLesson(null);
  };

  const handleEditFromHistoryOrCalendar = (lesson) => {
    setSelectedStudent(null);
    setEditingLesson(lesson);
    setIsReportingLesson(true);
  };

  const handleDeleteLesson = async (id) => { await deleteLesson(id); setViewLesson(null); };

  const handlePayment = async (p) => {
    await savePayment(p);
    setIsPaymentModalOpen(false);
    loadPaymentStats();
  };

  const handleSaveGrading = async (g) => {
    await saveGrading(g);
    setIsGradingModalOpen(false);
    setEditingGrading(null);
    loadPaymentStats();
  };

  const handleDeleteGrading = async (id) => {
    if (confirm('למחוק את הדיווח הזה?')) { await deleteGrading(id); loadPaymentStats(); }
  };

  const getUpcomingLessons = () => {
    const now = new Date();
    return schedule
      .filter(item => {
        if (item.type === 'block') return false;
        const end = new Date(item.end || new Date(item.start).getTime() + (item.hours || 1) * 3600000);
        return end > now;
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 5);
  };

  const getTimeStatus = (lesson) => {
    const now = new Date();
    const start = new Date(lesson.start);
    const end = new Date(lesson.end || start.getTime() + (lesson.hours || 1) * 3600000);
    if (now >= start && now < end) return { text: 'מתקיים כרגע 🔥', color: 'text-rose-500 dark:text-rose-400 animate-pulse' };
    const diffMin = Math.floor((start - now) / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays >= 1) return { text: `בעוד ${diffDays} ימים`, color: 'text-indigo-500 dark:text-indigo-400' };
    if (diffHrs >= 1) return { text: `בעוד ${diffHrs} שעות`, color: 'text-amber-500 dark:text-amber-400' };
    if (diffMin > 0) return { text: `בעוד ${diffMin} דקות`, color: 'text-emerald-500 dark:text-emerald-400' };
    return { text: 'בקרוב', color: 'text-slate-400' };
  };

  const fmt = (d, opts) => new Date(d).toLocaleTimeString ? new Date(d).toLocaleTimeString('he-IL', opts) : '';
  const formatTime = (d) => fmt(d, { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d) => new Date(d).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });

  const upcomingLessons = getUpcomingLessons();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">

      <div className="pb-24">

        {/* ─── HOME TAB ─── */}
        {view === 'students' && (
          <div>
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 pt-12 pb-7 rounded-b-[2rem] shadow-lg shadow-indigo-900/20">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    {new Date().toLocaleDateString('he-IL', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <h1 className="text-[1.6rem] font-black text-white mt-0.5 leading-tight">שלום זיו 👋</h1>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsPricingOpen(true)} className="p-2.5 bg-white/15 hover:bg-white/25 active:bg-white/10 rounded-xl text-white transition-colors">
                    <Settings size={20} />
                  </button>
                  <button onClick={() => auth.signOut()} className="p-2.5 bg-white/15 hover:bg-white/25 active:bg-white/10 rounded-xl text-white transition-colors">
                    <LogOut size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/15 rounded-2xl p-4 border border-white/20">
                  <p className="text-indigo-200 text-[11px] font-bold mb-2 flex items-center gap-1 uppercase tracking-wide">
                    <TrendingUp size={11} /> הכנסה החודש
                  </p>
                  <p className="text-2xl font-black text-white">₪{monthlyStats.total.toLocaleString()}</p>
                </div>
                <div className="bg-white/25 rounded-2xl p-4 border border-white/30">
                  <p className="text-indigo-100 text-[11px] font-bold mb-2 flex items-center gap-1 uppercase tracking-wide">
                    <CalendarIcon size={11} /> צפי עתידי
                  </p>
                  <p className="text-2xl font-black text-white">₪{futureIncome.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="px-4 mt-5 space-y-6">

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="bg-emerald-500 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-lg shadow-emerald-300/40 dark:shadow-none active:scale-[0.96] transition-transform"
                >
                  <CreditCard size={18} /> קבלת תשלום
                </button>
                <button
                  onClick={() => { setEditingLesson(null); setIsReportingLesson(true); }}
                  className="bg-indigo-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-lg shadow-indigo-300/40 dark:shadow-none active:scale-[0.96] transition-transform"
                >
                  <CalendarPlus size={18} /> קבע שיעור
                </button>
              </div>

              {upcomingLessons.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    <h2 className="text-sm font-black text-slate-700 dark:text-slate-300">שיעורים קרובים</h2>
                  </div>
                  <div className="space-y-2.5">
                    {upcomingLessons.map(lesson => {
                      const status = getTimeStatus(lesson);
                      const isFrontal = lesson.type === 'frontal';
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => setViewLesson(lesson)}
                          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
                        >
                          <div className={`p-3 rounded-xl flex-shrink-0 ${isFrontal ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-500' : 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-500'}`}>
                            {isFrontal ? <MapPin size={20} /> : <Video size={20} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-900 dark:text-white text-[15px] truncate">{lesson.studentName}</p>
                            <p className={`text-xs font-bold mt-0.5 ${status.color}`}>{status.text}</p>
                          </div>
                          <div className="text-left flex-shrink-0">
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100">{formatTime(lesson.start)}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(lesson.start)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-violet-500 rounded-full" />
                    <h2 className="text-sm font-black text-slate-700 dark:text-slate-300">תלמידים</h2>
                    <span className="text-[11px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{students.length}</span>
                  </div>
                  <button
                    onClick={() => setIsAddingStudent(!isAddingStudent)}
                    className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                  >
                    {isAddingStudent ? 'ביטול' : '+ חדש'}
                  </button>
                </div>

                {isAddingStudent && (
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 mb-3 animate-in fade-in slide-in-from-top-2">
                    <Input label="שם מלא" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                    <div className="mb-4">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">רמה</label>
                      <select value={newLevel} onChange={e => setNewLevel(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-all">
                        {Object.entries(LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setIsAddingStudent(false)} variant="secondary">ביטול</Button>
                      <Button onClick={handleAddStudent}>שמור</Button>
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-10 text-slate-400 text-sm font-bold">טוען...</div>
                ) : students.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
                    <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">אין תלמידים עדיין</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {students.map(student => (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform group relative overflow-hidden"
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0 ${LEVEL_AVATAR[student.level] || LEVEL_AVATAR.elementary}`}>
                          {student.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 dark:text-white text-[15px] leading-tight">{student.name}</p>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${LEVEL_BADGE[student.level] || LEVEL_BADGE.elementary}`}>
                            {LEVEL_LABELS[student.level]}
                          </span>
                        </div>
                        <p className={`font-mono font-black text-xl flex-shrink-0 ${student.balance < 0 ? 'text-rose-500' : student.balance > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {student.balance > 0 ? '+' : ''}{student.balance}₪
                        </p>
                        <div className="absolute top-3.5 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); setEditingStudent(student); }} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/40 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDeleteStudent(student.id); }} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/40 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* ─── CALENDAR TAB ─── */}
        {view === 'calendar' && (
          <div>
            <div className="px-4 pt-12 pb-4 flex justify-between items-center">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">לוח זמנים</h1>
              <button
                onClick={() => { setEditingLesson({ type: 'block' }); setIsReportingLesson(true); }}
                className="text-xs font-black bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-2 rounded-xl active:scale-95 transition-transform"
              >
                + חסימה
              </button>
            </div>
            <div className="px-4">
              <CalendarView schedule={schedule} onUpdate={() => {}} onEdit={lesson => setViewLesson(lesson)} />
            </div>
          </div>
        )}

        {/* ─── GRADINGS TAB ─── */}
        {view === 'gradings' && (
          <div>
            <div className="px-4 pt-12 pb-4 flex justify-between items-center">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">בדיקות ומשכורות</h1>
              <button
                onClick={() => setIsGradingModalOpen(true)}
                className="text-sm font-black bg-violet-600 text-white px-4 py-2 rounded-xl shadow-md shadow-violet-200 dark:shadow-none active:scale-95 transition-transform"
              >
                + דיווח
              </button>
            </div>
            <div className="px-4">
              <GradingsList gradings={gradings} onEdit={(item) => { setEditingGrading(item); setIsGradingModalOpen(true); }} onDelete={handleDeleteGrading} />
            </div>
          </div>
        )}

        {/* ─── STATS TAB ─── */}
        {view === 'stats' && (
          <div className="pt-12 px-4">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">דוחות</h1>
            <StatsPage />
          </div>
        )}

      </div>

      {/* ─── BOTTOM NAVIGATION ─── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex z-40 pb-safe">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
              view === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <tab.icon size={22} strokeWidth={view === tab.id ? 2.5 : 1.5} />
            <span className="text-[10px] font-black tracking-tight">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ─── MODALS ─── */}
      {selectedStudent && (
        <StudentDetails
          student={students.find(s => s.id === selectedStudent.id) || selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onEditLesson={handleEditFromHistoryOrCalendar}
        />
      )}

      {viewLesson && (
        <LessonDetails
          lesson={viewLesson}
          onClose={() => setViewLesson(null)}
          onEdit={() => { setViewLesson(null); setEditingLesson(viewLesson); setIsReportingLesson(true); }}
          onDelete={handleDeleteLesson}
        />
      )}

      {isReportingLesson && (
        <LessonForm
          students={students}
          onClose={() => { setIsReportingLesson(false); setEditingLesson(null); }}
          onSave={handleSaveLesson}
          initialData={editingLesson}
          existingEvents={schedule}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentForm students={students} onClose={() => setIsPaymentModalOpen(false)} onSave={handlePayment} />
      )}

      {(isGradingModalOpen || editingGrading) && (
        <GradingForm
          onClose={() => { setIsGradingModalOpen(false); setEditingGrading(null); }}
          onSave={handleSaveGrading}
          initialData={editingGrading}
        />
      )}

      {isPricingOpen && <PricingManager onClose={() => setIsPricingOpen(false)} onUpdate={() => {}} />}

      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end" onClick={() => setEditingStudent(null)}>
          <div
            className="bg-white dark:bg-slate-900 w-full rounded-t-3xl p-6 shadow-2xl border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
            <h3 className="font-black text-xl mb-5 text-slate-900 dark:text-white">עריכת תלמיד</h3>
            <Input label="שם מלא" value={editingStudent.name} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })} />
            <div className="mb-6">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">רמה</label>
              <select value={editingStudent.level} onChange={e => setEditingStudent({ ...editingStudent, level: e.target.value })} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition-all">
                {Object.entries(LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setEditingStudent(null)} variant="secondary">ביטול</Button>
              <Button onClick={handleUpdateStudent}>שמור</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
