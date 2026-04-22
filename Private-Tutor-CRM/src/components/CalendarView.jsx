import { useEffect, useRef, useState } from 'react';
import { MapPin, Video, Trash2, Ban, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { deleteLesson } from '../lib/storage';

export function CalendarView({ schedule, onUpdate, onEdit, onAddBlock }) {
  const scrollContainerRef = useRef(null);
  const [viewDate, setViewDate] = useState(new Date());

  const DAYS_TO_SHOW = 4;
  const START_HOUR = 7;
  const END_HOUR = 23;
  const HOUR_HEIGHT = 60; 

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT;
    }
  }, []);

  const moveView = (direction) => {
    const newDate = new Date(viewDate);
    newDate.setDate(viewDate.getDate() + (direction * DAYS_TO_SHOW));
    setViewDate(newDate);
  };

  const visibleDays = Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
    const d = new Date(viewDate);
    d.setDate(viewDate.getDate() + i);
    return d;
  });

  const getLessonsForDay = (dateObj) => {
    if (!schedule) return [];
    
    return schedule.filter(item => {
      
      if (!item.isRecurring) {
        const itemDate = new Date(item.start);
        return itemDate.toDateString() === dateObj.toDateString();
      }
      
      if (item.isRecurring) {
        if (item.dayOfWeek !== dateObj.getDay()) return false;
        if (item.recurringEndDate) {
           const endDate = new Date(item.recurringEndDate);
           endDate.setHours(23, 59, 59, 999);
           if (dateObj > endDate) return false;
        }
        return true;
      }
      return false;
    });
  };

  const isToday = (dateObj) => new Date().toDateString() === dateObj.toDateString();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[600px]" dir="rtl">
      
      {}
      <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button onClick={() => moveView(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"><ChevronRight size={20} /></button>
          <button onClick={() => setViewDate(new Date())} className="flex items-center gap-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-4 py-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
            <CalendarIcon size={14} /> היום
          </button>
          <button onClick={() => moveView(1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"><ChevronLeft size={20} /></button>
        </div>
        
        {onAddBlock && (
            <button onClick={onAddBlock} className="text-xs bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 font-bold px-3 py-2 rounded-xl flex items-center gap-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors border border-rose-100 dark:border-rose-900/50">
                <Ban size={12}/> חסימה
            </button>
        )}

        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 dir-ltr hidden sm:block">
           {visibleDays[0].getDate()}/{visibleDays[0].getMonth()+1} - {visibleDays[3].getDate()}/{visibleDays[3].getMonth()+1}
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 pr-[50px]">
        {visibleDays.map((day, i) => (
          <div key={i} className={`flex-1 py-3 text-center border-l border-slate-100 dark:border-slate-800 min-w-[80px] ${isToday(day) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
            <div className={`text-xs font-bold ${isToday(day) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{day.toLocaleDateString('he-IL', { weekday: 'short' })}</div>
            <div className={`text-sm font-black w-8 h-8 mx-auto rounded-full flex items-center justify-center mt-1 ${isToday(day) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' : 'text-slate-700 dark:text-slate-300'}`}>{day.getDate()}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto relative bg-white dark:bg-slate-900 custom-scrollbar" ref={scrollContainerRef}>
        <div className="flex min-h-full">
          <div className="w-[50px] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex-shrink-0 z-20 sticky left-0">
            {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
              <div key={i} className="text-[10px] text-slate-400 dark:text-slate-500 text-center relative font-medium" style={{ height: `${HOUR_HEIGHT}px` }}>
                <span className="relative -top-2 bg-white dark:bg-slate-900 px-1">{START_HOUR + i}:00</span>
              </div>
            ))}
          </div>

          <div className="flex flex-1 relative">
            <div className="absolute inset-0 z-0">
               {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                 <div key={i} className="border-b border-slate-50 dark:border-slate-800/60 w-full" style={{ height: `${HOUR_HEIGHT}px` }}></div>
               ))}
            </div>
            {visibleDays.map((day, dayIndex) => (
              <div key={dayIndex} className={`flex-1 border-l border-slate-100 dark:border-slate-800 relative min-w-[80px] z-10 ${isToday(day) ? 'bg-indigo-50/20 dark:bg-indigo-900/5' : ''}`}>
                {getLessonsForDay(day).map(lesson => {
                  const startDate = new Date(lesson.start);
                  const endDate = new Date(lesson.end);
                  
                  const startHour = startDate.getHours() + (startDate.getMinutes() / 60);
                  const durationHours = (endDate - startDate) / (1000 * 60 * 60); 

                  const top = (startHour - START_HOUR) * HOUR_HEIGHT;
                  const height = (durationHours || lesson.hours || 1) * HOUR_HEIGHT;
                  
                  const isBlock = lesson.type === 'block';

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => onEdit && onEdit(lesson)}
                      className={`absolute left-1 right-1 rounded-xl p-2 text-xs shadow-sm overflow-hidden cursor-pointer group hover:z-30 border-r-4 transition-all
                        ${isBlock 
                            ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-600 dark:text-slate-300 opacity-90' 
                            : 'bg-indigo-50 dark:bg-indigo-900/60 border-indigo-500 dark:border-indigo-400 text-indigo-900 dark:text-indigo-100 hover:shadow-md'}
                      `}
                      style={{ top: `${top}px`, height: `${height - 2}px` }}
                    >
                      <button 
                          onClick={(e) => { 
                              e.stopPropagation(); 
                              if(confirm('למחוק אירוע זה?')) { deleteLesson(lesson.id); onUpdate(); } 
                          }} 
                          className="absolute top-1 left-1 bg-white/80 dark:bg-black/40 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100 hover:text-rose-600 dark:hover:text-rose-400 z-30"
                      >
                        <Trash2 size={12} />
                      </button>

                      <div className="flex items-center gap-1 font-bold truncate">
                        {lesson.isRecurring && <Repeat size={10} className="shrink-0 opacity-70" />}
                        {isBlock && <Ban size={10} className="shrink-0 text-rose-500"/>}
                        <span className="truncate">{lesson.title || lesson.studentName}</span>
                      </div>
                      
                      {height > 35 && (
                        <div className="mt-0.5 opacity-80 flex flex-col text-[10px] leading-tight">
                           <span>{startDate.toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'})}</span>
                           {!isBlock && (
                             <div className="flex items-center gap-1 mt-0.5">
                               {(lesson.type === 'online') ? <Video size={10}/> : <MapPin size={10}/>} 
                               {lesson.type === 'online' ? 'אונליין' : 'פרונטלי'}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}