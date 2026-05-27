const admin = require('firebase-admin');
const express = require('express');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const calendarRouter = require('./calendar');

if (!fs.existsSync('./serviceAccountKey.json')) {
    console.error("CRITICAL ERROR: serviceAccountKey.json not found!");
} else {
    console.log("serviceAccountKey.json found successfully.");
}

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const BOT_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

let lastUpdateId = 0;
let sentReminders = new Set();

const timeOptions = {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Jerusalem'};
const dateOptions = {day: 'numeric', month: 'numeric', timeZone: 'Asia/Jerusalem'};
const fullDateOptions = {day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Asia/Jerusalem'};

const sendTelegramMessage = async (text) => {
  if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Missing Bot Token or Chat ID");
      return;
  }
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'HTML' }),
    });
    console.log("Message sent to Telegram");
  } catch (error) {
    console.error("Failed to send message:", error);
  }
};

const checkForCommands = async () => {
  if (!BOT_TOKEN) return;
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=0`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.ok && data.result.length > 0) {
      const updates = data.result;
      lastUpdateId = updates[updates.length - 1].update_id;

      for (const update of updates) {
        const text = update.message?.text;
        if (!text) continue;

        if (text === '/agenda') {
           const now = new Date();
           const snapshot = await db.collection('schedule').get();
           const lessons = [];

           snapshot.forEach(doc => {
             const data = doc.data();
             const start = data.start ? (data.start.toDate ? data.start.toDate() : new Date(data.start)) : null;
             if (start && start >= now && data.type !== 'block') {
               lessons.push({ ...data, start });
             }
           });

           lessons.sort((a, b) => a.start - b.start);
           const upcoming = lessons.slice(0, 10);

           if (upcoming.length === 0) {
             await sendTelegramMessage("📅 <b>היומן ריק!</b>\nאין שיעורים עתידיים כרגע.");
           } else {
             let msg = "📅 <b>שיעורים עתידיים:</b>\n\n";
             upcoming.forEach(l => {
               const dateStr = l.start.toLocaleDateString('he-IL', dateOptions);
               const timeStr = l.start.toLocaleTimeString('he-IL', timeOptions);
               msg += `🔹 <b>${l.studentName}</b> | ${dateStr} ב-${timeStr}\n`;
             });
             await sendTelegramMessage(msg);
           }
        }

        if (text === '/income') {
           const now = new Date();
           let startMonth = now.getMonth();
           let startYear = now.getFullYear();

           if (now.getDate() < 10) {
               startMonth--;
               if (startMonth < 0) { startMonth = 11; startYear--; }
           }

           const rangeStart = new Date(startYear, startMonth, 10);
           const rangeEnd = now;

           const studentsSnapshot = await db.collection('students').get();
           const studentsMap = {};
           studentsSnapshot.forEach(doc => {
               const sData = doc.data();
               studentsMap[doc.id] = sData.name;
               if(sData.userId) studentsMap[sData.userId] = sData.name;
           });

           const paymentsSnapshot = await db.collection('payments').get();
           const gradingsSnapshot = await db.collection('gradings').get();

           let totalIncome = 0;
           let count = 0;
           let items = [];

           paymentsSnapshot.forEach(doc => {
             const data = doc.data();
             let itemDate = data.date && data.date.toDate ? data.date.toDate() : new Date(data.date);

             if (itemDate >= rangeStart && itemDate <= rangeEnd) {
                 const amount = Number(data.amount || 0);
                 if (amount > 0) {
                     totalIncome += amount;
                     count++;

                     let studentName = studentsMap[data.studentId] || "תלמיד לא מזוהה";
                     let icon = '💰';
                     if (data.method === 'paybox') icon = '📱';
                     if (data.method === 'cash') icon = '💵';
                     if (data.method === 'transfer') icon = '🏦';

                     items.push({
                         date: itemDate,
                         text: `${icon} <b>${studentName}</b>: ₪${amount}`
                     });
                 }
             }
           });

           gradingsSnapshot.forEach(doc => {
             const data = doc.data();
             let itemDate = null;
             if (data.date) itemDate = new Date(data.date);
             else if (data.createdAt) itemDate = data.createdAt.toDate();

             if (itemDate && itemDate >= rangeStart && itemDate <= rangeEnd) {
                 const price = Number(data.totalPrice || 0);
                 if (price > 0) {
                     totalIncome += price;
                     count++;

                     let title = data.courseName || "בדיקה";
                     if (data.taskName) title += ` - ${data.taskName}`;

                     items.push({
                         date: itemDate,
                         text: `📝 <b>${title}</b>: ₪${price}`
                     });
                 }
             }
           });

           items.sort((a, b) => a.date - b.date);

           let itemsList = items.map(i => {
               const dateStr = i.date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
               return `${i.text} (${dateStr})`;
           }).join('\n');

           const startStr = rangeStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });

           const msg = `
💰 <b>דוח הכנסות (מזומן שנכנס)</b>
📅 מתאריך: <b>${startStr}</b>

💵 סה"כ הכנסות: <b>₪${totalIncome.toLocaleString()}</b>
📊 פעולות: <b>${count}</b>

<b>📝 פירוט תנועות:</b>
${itemsList || "אין נתונים"}
           `;

           await sendTelegramMessage(msg.trim());
        }
      }
    }
  } catch (error) {
    console.error("Error polling commands:", error);
  }
};

const checkReminders = async () => {
  try {
    const now = new Date();
    const snapshot = await db.collection('schedule').get();

    snapshot.forEach(doc => {
      const lesson = doc.data();
      if (!lesson.reminders || !Array.isArray(lesson.reminders) || lesson.reminders.length === 0) return;
      if (lesson.type === 'block') return;

      const lessonStart = lesson.start.toDate ? lesson.start.toDate() : new Date(lesson.start);
      const timeDiffMs = lessonStart.getTime() - now.getTime();
      const timeDiffMinutes = Math.round(timeDiffMs / 60000);

      if (timeDiffMinutes < 0) return;

      lesson.reminders.forEach(reminderMinutes => {
        const targetMinutes = Number(reminderMinutes);

        if (timeDiffMinutes <= targetMinutes && timeDiffMinutes > targetMinutes - 2) {
          const sentKey = `${doc.id}_${targetMinutes}`;
          if (sentReminders.has(sentKey)) return;

          const dateStr = lessonStart.toLocaleDateString('he-IL', fullDateOptions);
          const timeStr = lessonStart.toLocaleTimeString('he-IL', timeOptions);

          let timeRemainingStr = "";
          if (targetMinutes >= 10080) timeRemainingStr = `${Math.round(targetMinutes/10080)} שבועות`;
          else if (targetMinutes >= 1440) timeRemainingStr = `${Math.round(targetMinutes/1440)} ימים`;
          else if (targetMinutes >= 60) timeRemainingStr = `${Math.round(targetMinutes/60)} שעות`;
          else timeRemainingStr = `${targetMinutes} דקות`;

          let typeString = lesson.type === 'frontal'
              ? `🏫 פרונטלי ${lesson.location ? `- ${lesson.location}` : ''}`
              : "💻 אונליין";

          const msg = `
⏰ <b>תזכורת לשיעור!</b>
👨‍🎓 תלמיד: <b>${lesson.studentName}</b>
📅 תאריך: ${dateStr}
🕒 שעה: <b>${timeStr}</b>

סוג השיעור: ${typeString}

⏳ השיעור מתחיל בעוד: <b>${timeRemainingStr}</b>

💰 מחיר צפוי: ₪${lesson.price}

${lesson.needsLibrary ? '📚 להזמנת חדר בספרייה: https://gilboaweb.afeka.ac.il/#/Dashboard' : ''}
          `;

          await sendTelegramMessage(msg.trim());
          sentReminders.add(sentKey);

          setTimeout(() => sentReminders.delete(sentKey), 3600000);
        }
      });
    });

  } catch (error) {
    console.error("Error checking reminders:", error);
  }
};

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(calendarRouter);

app.get('/', (req, res) => {
  res.send('Clinic Bot is Running! 🤖');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/sync-outlook', async (req, res) => {
  const { title, start, end, outlookId, userId } = req.body;
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== process.env.SYNC_SECRET) {
    return res.status(401).send('Unauthorized');
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).send('Invalid date format');
  }

  try {
    const scheduleRef = admin.firestore().collection('schedule');
    const snapshot = await scheduleRef.where('outlookId', '==', outlookId).get();

    if (!snapshot.empty) {
      return res.status(200).send('Event already exists');
    }

    await scheduleRef.add({
      title,
      start: admin.firestore.Timestamp.fromDate(startDate),
      end: admin.firestore.Timestamp.fromDate(endDate),
      outlookId,
      userId,
      type: 'online',
      source: 'outlook',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).send('Event synced successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const keepAlive = () => {
  const serviceUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;
  fetch(`${serviceUrl}/health`)
    .then(() => console.log("♻️  Keep-alive ping sent"))
    .catch(err => console.warn("⚠️  Keep-alive ping failed:", err.message));
};

app.listen(port, () => {
  console.log(`Bot server listening on port ${port}`);

  if (process.env.TELEGRAM_TOKEN) {
      console.log("✅ Token found: " + process.env.TELEGRAM_TOKEN.substring(0, 5) + "...");
  } else {
      console.error("❌ ERROR: TELEGRAM_TOKEN is missing in Render Settings!");
  }

  setInterval(checkReminders, 60000);
  setInterval(checkForCommands, 3000);
  setInterval(keepAlive, 14 * 60 * 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("🔴 Unhandled Promise Rejection:", reason);
});

process.on('uncaughtException', (err) => {
  console.error("🔴 Uncaught Exception:", err);
});
