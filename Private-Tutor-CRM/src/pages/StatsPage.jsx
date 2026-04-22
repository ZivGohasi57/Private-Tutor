import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Wallet, BookOpen, GraduationCap, Banknote, CreditCard } from 'lucide-react';
import { getMonthlyReport, getStudents } from '../lib/storage';

export default function StatsPage() {
  
  const [date, setDate] = useState(() => {
    const d = new Date();
    if (d.getDate() < 10) {
        d.setMonth(d.getMonth() - 1);
    }
    return d;
  });

  const [data, setData] = useState({ lessons: [], gradings: [], payments: [] });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [report, studentsList] = await Promise.all([
        getMonthlyReport(date.getMonth(), date.getFullYear()),
        getStudents()
      ]);
      setData(report);
      setStudents(studentsList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const moveMonth = (dir) => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + dir);
    setDate(newDate);
  };

  
  const getDateObj = (d) => {
    if (!d) return new Date();
    return d.toDate ? d.toDate() : new Date(d);
  };

  
  const paymentsFromLessons = data.payments.reduce((sum, p) => sum + p.amount, 0);
  const salaryTotal = data.gradings.reduce((sum, g) => sum + g.totalPrice, 0);
  const grandTotalIncome = paymentsFromLessons + salaryTotal;

  const paymentMethods = data.payments.reduce((acc, p) => {
    const method = p.method || 'cash';
    acc[method] = (acc[method] || 0) + p.amount;
    return acc;
  }, {});

  
  const transactions = [
    ...data.payments.map(p => {
        const student = students.find(s => s.id === p.studentId);
        const pDate = getDateObj(p.date);
        return {
            id: p.id,
            date: pDate,
            title: student ? student.name : 'תשלום מתלמיד',
            subtitle: p.method || 'מזומן', 
            amount: p.amount,
            type: 'payment',
            icon: CreditCard,
            color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
        };
    }),
    ...data.gradings.map(g => {
        const gDate = getDateObj(g.date);
        return {
            id: g.id,
            date: gDate,
            title: g.courseName,
            subtitle: g.taskName || 'משכורת/בדיקה',
            amount: g.totalPrice,
            type: 'salary',
            icon: Banknote,
            color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20'
        };
    })
  ].sort((a, b) => b.date - a.date);

  
  const rangeStart = new Date(date.getFullYear(), date.getMonth(), 10);
  const rangeEnd = new Date(date.getFullYear(), date.getMonth() + 1, 10);
  const displayRange = `${rangeStart.getDate()}/${rangeStart.getMonth()+1} - ${rangeEnd.getDate()}/${rangeEnd.getMonth()+1}`;

  return (
    <div className="space-y-6 animate-in fade-in pb-4">
      
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <button onClick={() => moveMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full dark:text-slate-200"><ChevronRight/></button>
        <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</h2>
            <p className="text-xs text-slate-400 font-bold" dir="ltr">{displayRange}</p>
        </div>
        <button onClick={() => moveMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full dark:text-slate-200"><ChevronLeft/></button>
      </div>

      <div className="bg-gray-900 dark:bg-slate-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-gray-400 text-sm mb-1">סה"כ הכנסות (תזרים בפועל)</p>
          <h3 className="text-4xl font-bold">₪{grandTotalIncome.toLocaleString()}</h3>
          <div className="flex gap-4 mt-4">
             <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1 rounded-full">
               <GraduationCap size={14}/> תלמידים: ₪{paymentsFromLessons.toLocaleString()}
             </div>
             <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1 rounded-full">
               <BookOpen size={14}/> משכורות: ₪{salaryTotal.toLocaleString()}
             </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 opacity-20"></div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
         <h4 className="font-bold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2">
           <Wallet size={18} className="text-green-500"/> מקורות הכסף
         </h4>
         <div className="space-y-4">
            <MethodBar label="משכורת/בדיקות" amount={salaryTotal} total={grandTotalIncome} color="bg-indigo-500" />
            <hr className="border-gray-100 dark:border-slate-700" />
            <MethodBar label="Bit" amount={paymentMethods.bit || 0} total={grandTotalIncome} color="bg-blue-500" />
            <MethodBar label="PayBox" amount={paymentMethods.paybox || 0} total={grandTotalIncome} color="bg-purple-500" />
            <MethodBar label="מזומן / העברה" amount={paymentMethods.cash || 0} total={grandTotalIncome} color="bg-green-500" />
         </div>
      </div>

      <div>
        <h4 className="font-bold text-gray-700 dark:text-slate-300 mb-3 text-sm px-2">פירוט הכנסות החודש ({displayRange})</h4>
        <div className="space-y-3">
            {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                    עדיין אין הכנסות החודש
                </div>
            ) : (
                transactions.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700/50 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${item.color}`}>
                                <item.icon size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{item.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                    <span>{item.date.toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})}</span>
                                    <span className="opacity-40">|</span>
                                    <span className="font-medium bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded capitalize">
                                      {item.subtitle}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="text-left">
                            <span className="font-bold text-gray-800 dark:text-white block">+₪{item.amount.toLocaleString()}</span>
                        </div>
                  </div>
                ))
            )}
        </div>
      </div>

    </div>
  );
}

function MethodBar({ label, amount, total, color }) {
  const percent = total > 0 ? (amount / total) * 100 : 0;
  if (amount === 0) return null;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-bold text-gray-600 dark:text-slate-400">{label}</span>
        <span className="text-gray-900 dark:text-white font-mono">₪{amount.toLocaleString()}</span>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}