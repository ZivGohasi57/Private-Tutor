import { useState, useEffect, useRef } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { recalculateStudentBalance } from './lib/storage';
import LoginPage from './pages/LoginPage';
import StudentsPage from './pages/StudentsPage';
import { Loader2 } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const processStartedLessons = async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      try {
        const now = new Date();
        const q = query(
          collection(db, 'schedule'),
          where('userId', '==', user.uid),
          where('start', '<', Timestamp.fromDate(now)),
          where('isCharged', '==', false)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;

        const batch = writeBatch(db);
        const affectedStudentIds = new Set();

        snapshot.docs.forEach((lessonDoc) => {
          const lesson = lessonDoc.data();
          if (lesson.type === 'block' || !lesson.studentId || !lesson.price) return;
          batch.update(doc(db, 'schedule', lessonDoc.id), { isCharged: true });
          affectedStudentIds.add(lesson.studentId);
        });

        if (affectedStudentIds.size > 0) {
          await batch.commit();
          await Promise.all([...affectedStudentIds].map(id => recalculateStudentBalance(id)));
        }
      } catch (error) {
        console.error(error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    processStartedLessons();
    const interval = setInterval(processStartedLessons, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {user ? <StudentsPage /> : <LoginPage />}
    </div>
  );
}

export default App;
