import { useState, useEffect } from 'react';
import { X, Clock, MapPin, Video, Bell, Check, Ban, Calendar, Repeat, AlertCircle, Info } from 'lucide-react';

export function LessonForm({ students, onClose, onSave, initialData, existingEvents = [] }) {
  const [eventType, setEventType] = useState((initialData?.type === 'block') ? 'block' : 'lesson');
  const [error, setError] = useState(null);

  const [studentIds, setStudentIds] = useState(['']); 
  const [studentCount, setStudentCount] = useState(1);
  
  const [totalPrice, setTotalPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0); 
  
  const [isFrontal, setIsFrontal] = useState(true);
  const [location, setLocation] = useState('');
  const [needsLibrary, setNeedsLibrary] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState([1440]); 

  const [blockType, setBlockType] = useState(initialData?.isRecurring ? 'recurring' : 'one-time');
  const [blockTitle, setBlockTitle] = useState(initialData?.title || 'חסימת לו"ז');
  const [recurringDay, setRecurringDay] = useState(initialData?.dayOfWeek ?? new Date().getDay());
  const [recurringEndDate, setRecurringEndDate] = useState(initialData?.recurringEndDate ? new Date(initialData.recurringEndDate).toISOString().split('T')[0] : '');

  const [date, setDate] = useState(initialData?.start ? new Date(initialData.start).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialData?.start ? new Date(initialData.start).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}) : '10:00');
  const [endTime, setEndTime] = useState(initialData?.end ? new Date(initialData.end).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}) : '11:00');
  const [hours, setHours] = useState(initialData?.hours || 1);


  const reminderOptions = [
    { label: '30 דק׳', value: 30 },
    { label: 'שעה', value: 60 },
    { label: 'יום', value: 1440 },
    { label: 'שבוע', value: 10080 }
  ];

  useEffect(() => {
    if (!isFrontal) setNeedsLibrary(false);
  }, [isFrontal]);

  useEffect(() => {
    if (initialData) {
        if (initialData.type === 'block') {
            setEventType('block');
            setBlockTitle(initialData.title || 'חסימת לו"ז');
            setBlockType(initialData.isRecurring ? 'recurring' : 'one-time');
            if (initialData.dayOfWeek !== undefined) setRecurringDay(initialData.dayOfWeek);
            if (initialData.recurringEndDate) setRecurringEndDate(new Date(initialData.recurringEndDate).toISOString().split('T')[0]);
        } 
        else if (initialData.studentId || initialData.studentIds) {
            setEventType('lesson');
            setStudentIds([initialData.studentId]); 
            setStudentCount(1);
            setTotalPrice(initialData.price || 0);
            setOriginalPrice(initialData.price || 0);
            setIsFrontal(initialData.type === 'frontal');
            setLocation(initialData.location || '');
            setNeedsLibrary(Boolean(initialData.needsLibrary));
            setHasReminder(initialData.hasReminder || false);
            if (initialData.reminders) setSelectedReminders(initialData.reminders);
        }
    }
  }, [initialData]);

  const handleCountChange = (val) => {
    const count = Math.max(1, Number(val));
    setStudentCount(count);
    setStudentIds(prev => {
      const newIds = [...prev];
      if (count > prev.length) while (newIds.length < count) newIds.push('');
      else newIds.length = count;
      return newIds;
    });
  };

  const handleStudentSelect = (index, value) => {
    const newIds = [...studentIds];
    newIds[index] = value;
    setStudentIds(newIds);
  };

  const toggleReminder = (val) => {
    setSelectedReminders(prev => 
      prev.includes(val) ? prev.filter(r => r !== val) : [...prev, val]
    );
  };

  useEffect(() => {
    if (eventType === 'block') return;

    const firstStudentId = studentIds[0];
    const firstStudent = students.find(s => s.id === firstStudentId);
    
    if (!firstStudent) return;

    const level = (firstStudent.level || '').toLowerCase().trim();
    const count = studentCount;
    const duration = Number(hours) || 0;
    
    let pricePerStudent = 0;

    if (['elementary', 'יסודי'].some(t => level.includes(t))) {
      pricePerStudent = count === 1 ? 120 : 0; 
    } 
    else if (['middle', 'חטיבה'].some(t => level.includes(t))) {
      pricePerStudent = count === 1 ? 140 : (count === 2 ? 120 : 100);
    }
    else if (['high', 'תיכון'].some(t => level.includes(t))) {
      pricePerStudent = count === 1 ? 160 : (count === 2 ? 140 : 120);
    }
    else if (['student', 'academic', 'סטודנט'].some(t => level.includes(t))) {
      if (count === 1) {
        pricePerStudent = duration <= 1 ? (200 * duration) : (200 + ((duration - 1) * 150));
      } else {
        pricePerStudent = count === 2 ? 170 : 150;
      }
    }

    let calculatedBasePrice = 0;
    if (['student', 'academic', 'סטודנט'].some(t => level.includes(t)) && count === 1) {
        calculatedBasePrice = pricePerStudent;
    } else {
        calculatedBasePrice = pricePerStudent * count * duration;
    }

    setOriginalPrice(calculatedBasePrice);

    if (!initialData && calculatedBasePrice > 0) {
        const studentBalance = firstStudent.balance || 0;
        const adjustedPrice = calculatedBasePrice - studentBalance;
        setTotalPrice(adjustedPrice);
    } else if (initialData) {
        if (calculatedBasePrice !== initialData.price) {
             setTotalPrice(calculatedBasePrice); 
        }
    } else {
        setTotalPrice(calculatedBasePrice);
    }

  }, [studentIds, studentCount, hours, students, eventType]); 

  const checkConflicts = (newStart, newEnd) => {
    const newStartMinutes = newStart.getHours() * 60 + newStart.getMinutes();
    const newEndMinutes = newEnd.getHours() * 60 + newEnd.getMinutes();
    const newDay = newStart.getDay();

    for (const event of existingEvents) {
      if (initialData && event.id === initialData.id) continue;

      const evtStart = new Date(event.start);
      const evtEnd = new Date(event.end);
      
      const evtStartMinutes = evtStart.getHours() * 60 + evtStart.getMinutes();
      const evtEndMinutes = evtEnd.getHours() * 60 + evtEnd.getMinutes();

      if (!event.isRecurring) {
        if (newStart < evtEnd && newEnd > evtStart) {
           return `הזמן תפוס על ידי: ${event.title || event.studentName}`;
        }
      } 
      else if (event.isRecurring) {
         if (event.recurringEndDate && newStart > new Date(event.recurringEndDate)) continue;
         
         if (event.dayOfWeek === newDay) {
            if (newStartMinutes < evtEndMinutes && newEndMinutes > evtStartMinutes) {
               return `חסימה קבועה: ${event.title}`;
            }
         }
      }
    }
    return null;
  };

  const handleSubmit = () => {
    setError(null);
    const startDateTime = new Date(`${date}T${time}`);
    let endDateTime;
    let durationHours = Number(hours);

    if (eventType === 'block') {
        endDateTime = new Date(`${date}T${endTime}`);
        if (endDateTime <= startDateTime) {
            setError("שעת הסיום חייבת להיות אחרי שעת ההתחלה");
            return;
        }
        const diffMs = endDateTime - startDateTime;
        durationHours = diffMs / (1000 * 60 * 60);
    } else {
        endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);
    }

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setError("תאריך או שעה לא תקינים");
        return;
    }

    if (blockType !== 'recurring') {
        const conflict = checkConflicts(startDateTime, endDateTime);
        if (conflict) {
            setError(conflict);
            return;
        }
    }

    if (eventType === 'block') {
        const blockData = {
            ...initialData,
            type: 'block',
            title: blockTitle,
            start: startDateTime,
            end: endDateTime,
            hours: durationHours,
            isRecurring: blockType === 'recurring',
            dayOfWeek: blockType === 'recurring' ? recurringDay : null,
            recurringEndDate: (blockType === 'recurring' && recurringEndDate) 
                ? new Date(recurringEndDate).toISOString() 
                : null
        };
        onSave(blockData);
    } 
    else {
        const validStudents = studentIds.filter(id => id !== '');
        if (validStudents.length !== studentCount) {
            setError('נא לבחור תלמיד לכל שורה');
            return;
        }
        
        const pricePerHead = totalPrice / studentCount;

        if (initialData) {
            const updatedLesson = {
                ...initialData,
                studentId: validStudents[0],
                studentName: students.find(s => s.id === validStudents[0])?.name,
                start: startDateTime,
                end: endDateTime,
                hours: durationHours,
                price: Number(totalPrice),
                type: isFrontal ? 'frontal' : 'online',
                location: isFrontal ? location : 'Zoom/Online',
                needsLibrary: Boolean(needsLibrary),
                hasReminder,
                reminders: hasReminder ? selectedReminders : []
            };
            onSave(updatedLesson);
        } else {
            const lessonsToSave = validStudents.map(id => {
                const student = students.find(s => s.id === id);
                return {
                    title: student.name,
                    studentId: id,
                    studentName: student.name,
                    start: startDateTime,
                    end: endDateTime,
                    hours: durationHours,
                    price: pricePerHead,
                    type: isFrontal ? 'frontal' : 'online',
                    location: isFrontal ? location : 'Zoom/Online',
                    needsLibrary: Boolean(needsLibrary),
                    hasReminder,
                    reminders: hasReminder ? selectedReminders : [],
                    isCharged: false,
                    reminderSent: false
                };
            });
            onSave(lessonsToSave);
        }
    }
  };

  const inputClass = "w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto text-right border border-slate-100 dark:border-slate-800">
        
        <div className="p-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 z-10">
          <h2 className="font-black text-xl text-slate-800 dark:text-white">{initialData ? 'עריכת אירוע' : 'שיבוץ חדש'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-4">
            <button 
                onClick={() => setEventType('lesson')} 
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${eventType === 'lesson' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
                <Calendar size={16}/> שיעור
            </button>
            <button 
                onClick={() => setEventType('block')} 
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${eventType === 'block' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
                <Ban size={16}/> חסימה
            </button>
          </div>

          {eventType === 'lesson' && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
                {!initialData && (
                    <div>
                        <label className={labelClass}>כמות תלמידים</label>
                        <input type="number" min="1" max="10" value={studentCount} onChange={e => handleCountChange(e.target.value)} className={inputClass} />
                    </div>
                )}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {studentIds.map((sid, idx) => (
                        <div key={idx}>
                            <label className={labelClass}>תלמיד {!initialData && (idx + 1)}</label>
                            <select value={sid} onChange={e => handleStudentSelect(idx, e.target.value)} className={inputClass}>
                                <option value="">בחר תלמיד...</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.level})</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {eventType === 'block' && (
             <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50 animate-in slide-in-from-top-2 space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setBlockType('one-time')} className={`flex-1 text-xs py-2 rounded-xl border font-bold transition-colors ${blockType === 'one-time' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>חד פעמי</button>
                  <button onClick={() => setBlockType('recurring')} className={`flex-1 text-xs py-2 rounded-xl border font-bold flex justify-center items-center gap-1 transition-colors ${blockType === 'recurring' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}><Repeat size={14}/> שבועי</button>
                </div>
                
                {blockType === 'recurring' && (
                  <div className="space-y-3 pt-2 border-t border-rose-200 dark:border-rose-800/50">
                     <div>
                        <label className="text-xs font-bold text-rose-800 dark:text-rose-300 mb-1 block">יום בשבוע</label>
                        <select value={recurringDay} onChange={(e) => setRecurringDay(Number(e.target.value))} className="w-full p-2.5 text-sm rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none">
                          <option value="0">ראשון</option><option value="1">שני</option><option value="2">שלישי</option>
                          <option value="3">רביעי</option><option value="4">חמישי</option><option value="5">שישי</option><option value="6">שבת</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-rose-800 dark:text-rose-300 mb-1 block">חסימה עד תאריך (אופציונלי)</label>
                        <input type="date" value={recurringEndDate} onChange={(e) => setRecurringEndDate(e.target.value)} className="w-full p-2.5 text-sm rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none" />
                     </div>
                  </div>
                )}
                <input 
                    type="text" 
                    value={blockTitle} 
                    onChange={e => setBlockTitle(e.target.value)} 
                    placeholder="סיבת החסימה (למשל: לימודים)" 
                    className="w-full p-3 border border-rose-200 dark:border-rose-800/50 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                />
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className={labelClass}>תאריך</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
            </div>
            
            {eventType === 'block' ? (
                <>
                    <div>
                        <label className={labelClass}>התחלה</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>סיום</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClass} />
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <label className={labelClass}>שעה</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>משך (שעות)</label>
                        <input type="number" step="0.5" value={hours} onChange={e => setHours(Number(e.target.value))} className={inputClass} />
                    </div>
                </>
            )}
          </div>

          {eventType === 'lesson' && (
            <>
                <div>
                   <label className={labelClass}>מחיר סה"כ (לגבייה)</label>
                   <div className="relative">
                     <input type="number" value={totalPrice} onChange={e => setTotalPrice(Number(e.target.value))} className={`${inputClass} font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800`} />
                     <span className="absolute left-4 top-3.5 text-indigo-400 font-bold">₪</span>
                   </div>
                   
                   {(!initialData && totalPrice !== originalPrice && originalPrice > 0) && (
                     <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-800/50 animate-pulse">
                        <Info size={14} className="shrink-0" />
                        <span>שים לב: המחיר שוקלל עם יתרה קודמת (מחיר רגיל: {originalPrice}₪)</span>
                     </div>
                   )}
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                    <button onClick={() => setIsFrontal(true)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isFrontal ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}><MapPin size={16} className="inline ml-1"/> פרונטלי</button>
                    <button onClick={() => setIsFrontal(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isFrontal ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}><Video size={16} className="inline ml-1"/> אונליין</button>
                </div>
                {isFrontal && (
                  <div className="space-y-2">
                    <input type="text" placeholder="כתובת" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} />
                    <label className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                      <span>צריך חדר בספרייה</span>
                      <input type="checkbox" checked={needsLibrary} onChange={e => setNeedsLibrary(e.target.checked)} className="accent-amber-500 w-5 h-5" />
                    </label>
                  </div>
                )}

                <div className={`border rounded-2xl overflow-hidden ${hasReminder ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between p-4 border-b border-black/5 dark:border-white/5">
                        <div className={`flex gap-2 text-sm font-bold ${hasReminder ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}`}><Bell size={18} className={hasReminder ? "text-amber-500" : ""}/> תזכורות</div>
                        <input type="checkbox" checked={hasReminder} onChange={e => setHasReminder(e.target.checked)} className="accent-amber-500 w-5 h-5" />
                    </div>
                    {hasReminder && (
                        <div className="p-3 grid grid-cols-2 gap-2">
                        {reminderOptions.map(opt => (
                            <button key={opt.value} onClick={() => toggleReminder(opt.value)} className={`text-xs p-2 rounded-lg border font-medium flex items-center justify-center gap-1 transition-colors ${selectedReminders.includes(opt.value) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
                                {selectedReminders.includes(opt.value) && <Check size={12}/>} {opt.label}
                            </button>
                        ))}
                        </div>
                    )}
                </div>
            </>
          )}

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 text-sm font-bold rounded-2xl flex items-start gap-2 animate-pulse border border-rose-100 dark:border-rose-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0"/>
              <span>{error}</span>
            </div>
          )}

          <button onClick={handleSubmit} className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all ${eventType === 'block' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}>
             {eventType === 'block' ? 'שמור חסימה' : (initialData ? 'שמור שינויים' : 'קבע שיעור')}
          </button>
        </div>
      </div>
    </div>
  );
}