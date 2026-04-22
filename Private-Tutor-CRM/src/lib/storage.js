import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  query, where, orderBy, getDoc, writeBatch, onSnapshot, getDocs 
} from 'firebase/firestore';
import { db, auth } from './firebase'; 


const COLL = {
  STUDENTS: 'students',
  SCHEDULE: 'schedule',
  PAYMENTS: 'payments',
  GRADINGS: 'gradings',
  COURSES: 'courses'
};

const getUid = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
};

const convertDates = (doc) => {
  const data = doc.data();
  return { 
    id: doc.id,
    ...data,
    start: data.start?.toDate ? data.start.toDate() : new Date(data.start),
    end: data.end?.toDate ? data.end.toDate() : new Date(data.end),
    date: data.start?.toDate ? data.start.toDate() : new Date(data.start)
  };
};



export const listenToStudents = (callback) => {
  try {
    const uid = getUid();
    const q = query(collection(db, COLL.STUDENTS), where('userId', '==', uid), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(students);
    });
  } catch (e) {
    console.error("Auth error in listenToStudents", e);
    return () => {};
  }
};

export const getStudents = async () => {
    const uid = getUid();
    const q = query(collection(db, COLL.STUDENTS), where('userId', '==', uid), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const saveStudent = async (student) => {
  const uid = getUid();
  if (student.id) {
    const ref = doc(db, COLL.STUDENTS, student.id);
    await updateDoc(ref, student);
  } else {
    await addDoc(collection(db, COLL.STUDENTS), { ...student, userId: uid, createdAt: new Date() });
  }
};

export const deleteStudent = async (id) => await deleteDoc(doc(db, COLL.STUDENTS, id));



export const listenToSchedule = (callback) => {
  try {
    const uid = getUid();
    const q = query(collection(db, COLL.SCHEDULE), where('userId', '==', uid), orderBy('start', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const schedule = snapshot.docs.map(convertDates);
      callback(schedule);
    });
  } catch (e) {
    return () => {};
  }
};

export const getAllSchedule = async () => {
  const uid = getUid();
  const q = query(collection(db, COLL.SCHEDULE), where('userId', '==', uid), orderBy('start', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertDates);
};

export const checkConflict = async (newStart, newEnd, excludeId = null) => {
  const allLessons = await getAllSchedule();
  const startMs = new Date(newStart).getTime();
  const endMs = new Date(newEnd).getTime();
  return allLessons.find(l => {
    if (excludeId && l.id === excludeId) return false;
    const lStart = l.start.getTime();
    const lEnd = l.end.getTime();
    return (startMs < lEnd && endMs > lStart);
  });
};

export const updateLesson = async (lesson) => {
  const lessonRef = doc(db, COLL.SCHEDULE, lesson.id);
  const { id, date, ...dataToUpdate } = lesson;
  await updateDoc(lessonRef, dataToUpdate);
  await recalculateStudentBalance(lesson.studentId);
};

export const saveBulkLessons = async (lessons) => {
  const uid = getUid();
  const batch = writeBatch(db);
  let studentIdToUpdate = null;

  for (const lesson of lessons) {
    const lessonRef = doc(collection(db, COLL.SCHEDULE));
    batch.set(lessonRef, { ...lesson, userId: uid });
    studentIdToUpdate = lesson.studentId;
  }
  await batch.commit();
  if (studentIdToUpdate) {
      await recalculateStudentBalance(studentIdToUpdate);
  }
};

export const saveLesson = async (lesson) => {
  await saveBulkLessons([lesson]);
};

export const deleteLesson = async (id) => {
    const docRef = doc(db, COLL.SCHEDULE, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const lesson = docSnap.data();
        await deleteDoc(docRef);
        await recalculateStudentBalance(lesson.studentId);
    }
};



export const savePayment = async (payment) => {
  const uid = getUid();
  await addDoc(collection(db, COLL.PAYMENTS), { ...payment, userId: uid, date: new Date() });
  await recalculateStudentBalance(payment.studentId);
};

export const deletePayment = async (id) => {
    const docRef = doc(db, COLL.PAYMENTS, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const payment = docSnap.data();
        await deleteDoc(docRef);
        await recalculateStudentBalance(payment.studentId);
    }
};

export const getFutureIncome = async () => {
  const now = new Date();
  const allSchedule = await getAllSchedule(); 
  return allSchedule
    .filter(l => l.start >= now && l.price && l.type !== 'block')
    .reduce((sum, l) => sum + Number(l.price), 0);
};


export const getMonthlyReport = async (month, year) => {
  const uid = getUid();
  
  
  const startDate = new Date(year, month, 10, 0, 0, 0);
  const endDate = new Date(year, month + 1, 10, 0, 0, 0);

  const [paymentsSnap, scheduleSnap, gradingsSnap] = await Promise.all([
    getDocs(query(collection(db, COLL.PAYMENTS), where('userId', '==', uid))),
    getDocs(query(collection(db, COLL.SCHEDULE), where('userId', '==', uid))),
    getDocs(query(collection(db, COLL.GRADINGS), where('userId', '==', uid)))
  ]);

  const payments = paymentsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => {
      const d = p.date?.toDate ? p.date.toDate() : new Date(p.date);
      return d >= startDate && d < endDate;
    });

  const lessons = scheduleSnap.docs
    .map(convertDates)
    .filter(l => {
      return l.price > 0 && l.start >= startDate && l.start < endDate;
    });

  const gradings = gradingsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(g => {
      const d = g.date?.toDate ? g.date.toDate() : new Date(g.date);
      return d >= startDate && d < endDate;
    });

  return { payments, lessons, gradings };
};


export const getMonthlyStats = async () => {
  try {
    const now = new Date();
    
    
    
    if (now.getDate() < 10) {
        now.setMonth(now.getMonth() - 1);
    }

    const report = await getMonthlyReport(now.getMonth(), now.getFullYear());

    const totalPayments = report.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalGradings = report.gradings.reduce((sum, g) => sum + Number(g.totalPrice), 0);

    return { total: totalPayments + totalGradings };

  } catch (e) {
    console.error("Error getting monthly stats:", e);
    return { total: 0 };
  }
};



export const listenToGradings = (callback) => {
    try {
      const uid = getUid();
      const q = query(collection(db, COLL.GRADINGS), where('userId', '==', uid), orderBy('date', 'desc'));
      return onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          callback(data);
      });
    } catch(e) { return () => {}; }
};

export const getGradings = async () => {
    const uid = getUid();
    const q = query(collection(db, COLL.GRADINGS), where('userId', '==', uid), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const saveGrading = async (grading) => {
  const uid = getUid();
  if (grading.id) {
    const ref = doc(db, COLL.GRADINGS, grading.id);
    const { id, ...data } = grading;
    await updateDoc(ref, data);
  } else {
    await addDoc(collection(db, COLL.GRADINGS), {
      ...grading,
      userId: uid,
      createdAt: new Date(),
      date: grading.date || new Date().toISOString()
    });
  }
};

export const deleteGrading = async (id) => await deleteDoc(doc(db, COLL.GRADINGS, id));

export const getCourses = async () => {
  try {
    const uid = getUid();
    const q = query(collection(db, COLL.COURSES), where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch(e) { 
    console.error("Error fetching courses:", e); 
    return []; 
  }
};

export const saveCourse = async (course) => {
    const uid = getUid();
    await addDoc(collection(db, COLL.COURSES), { ...course, userId: uid, createdAt: new Date() });
};

export const deleteCourse = async (id) => await deleteDoc(doc(db, COLL.COURSES, id));



export const getStudentHistory = async (studentId) => {
    await recalculateStudentBalance(studentId);
    try {
        const [allLessons, allPayments] = await Promise.all([
            getAllSchedule(),
            getPaymentsForStudent(studentId)
        ]);

        const lessons = allLessons
            .filter(l => l.studentId === studentId && l.type !== 'block')
            .map(l => ({ ...l, dataType: 'lesson' }));

        const payments = allPayments.map(p => ({
            ...p,
            dataType: 'payment',
            start: p.date?.toDate ? p.date.toDate() : new Date(p.date)
        }));

        return [...lessons, ...payments].sort((a, b) => b.start - a.start);
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};

const getPaymentsForStudent = async (studentId) => {
    const uid = getUid();
    const q = query(collection(db, COLL.PAYMENTS), where('userId', '==', uid), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({id: d.id, ...d.data()}));
};

export const recalculateStudentBalance = async (studentId) => {
    if (!studentId) return;
    const now = new Date();

    try {
        const payments = await getPaymentsForStudent(studentId);
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

        const allSchedule = await getAllSchedule();
        const pastLessons = allSchedule.filter(l => 
            l.studentId === studentId && 
            l.type !== 'block' &&
            l.start < now 
        );

        const totalDebt = pastLessons.reduce((sum, l) => sum + Number(l.price), 0);
        const newBalance = totalPaid - totalDebt;

        const studentRef = doc(db, COLL.STUDENTS, studentId);
        await updateDoc(studentRef, { balance: newBalance });
        
        return newBalance;
    } catch (e) {
        console.error("Error recalculating balance:", e);
    }
};

export const migrateOldData = async () => {
  const uid = auth.currentUser?.uid;
  if (!uid) return alert("שגיאה: משתמש לא מחובר");

  if (!confirm('האם אתה בטוח שברצונך לשייך את כל הנתונים הישנים במערכת למשתמש הנוכחי שלך?')) return;

  const collections = ['students', 'schedule', 'payments', 'gradings', 'courses'];
  let totalUpdated = 0;

  try {
    for (const colName of collections) {
      const snapshot = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      let batchCount = 0;

      snapshot.docs.forEach(doc => {
        if (!doc.data().userId) {
          batch.update(doc.ref, { userId: uid });
          batchCount++;
          totalUpdated++;
        }
      });

      if (batchCount > 0) {
        await batch.commit();
        console.log(`Updated ${batchCount} in ${colName}`);
      }
    }

    alert(`תהליך הסתיים בהצלחה! שוחזרו ${totalUpdated} פריטים. הדף יתרענן כעת.`);
    window.location.reload();
  } catch (e) {
    console.error(e);
    alert('אירעה שגיאה בתהליך השחזור: ' + e.message);
  }
};