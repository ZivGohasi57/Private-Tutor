# Private Tutor CRM — Full-Stack Tutoring Management System

[![React](https://img.shields.io/badge/React-19%2B-blue.svg)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Style-Tailwind%20CSS-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Bot-Node.js-339933.svg)](https://nodejs.org/)
[![Telegram](https://img.shields.io/badge/Notifications-Telegram-2CA5E0.svg)](https://core.telegram.org/bots)
[![License: Personal](https://img.shields.io/badge/License-Personal-green.svg)](#license)

A full-stack **tutoring management system** built for independent educators.
Designed as a complete work toolkit — from student onboarding and lesson scheduling to real-time financial reporting and automated Telegram reminders.

The system is split into two services that share a single Firestore database:
a **React web dashboard** deployed on Vercel, and a **Node.js Telegram bot** running on Render.

---

## 🧠 Core Features

### 👨‍🎓 Student Management
* **Student Profiles**: Full CRUD with name, academic level, and real-time balance display.
* **Level Tiers**: Elementary / Middle School / High School / Academic — each tier has its own pricing logic.
* **Balance Tracking**: Auto-recalculated on every lesson or payment event — never stale.
* **Student History**: Full chronological log of lessons and payments per student.

### 📅 Scheduling & Calendar
* **Lesson Types**: Online or Frontal (with location and optional library booking link).
* **Bulk & Recurring Lessons**: Schedule multiple students at once or set up recurring weekly blocks.
* **Schedule Blocking**: Mark unavailable time slots (one-time or recurring) to prevent conflicts.
* **Conflict Detection**: Automatically warns when a new lesson overlaps an existing event.
* **Calendar View**: Month/week visual overview of the full schedule.
* **Configurable Reminders**: Per-lesson Telegram alerts at 30 min / 1 hr / 1 day / 1 week before start.

### 💰 Financial Engine
* **Auto-Charge**: Every 10 seconds, past lessons that haven't been charged are automatically deducted from the student's balance.
* **Payment Logging**: Record payments by method — Bit, PayBox, Cash, or Bank Transfer.
* **Grading & TA Income**: Separate income stream for university course grading and TA work, tracked per course and task.
* **Monthly Reports**: Cash-flow reports from the 10th of each month, showing income by source (student payments vs. grading salary).
* **Future Income Forecast**: Dashboard card showing the total value of all upcoming scheduled lessons.
* **Income Breakdown**: Visual bar charts by payment method on the Stats page.

### 📊 Stats & Reporting
* **Monthly Cash-Flow Report**: Navigate month-by-month to see total income, broken down by source and method.
* **Transaction Log**: Chronological list of every payment and grading entry per period.
* **Real-Time Dashboard**: Live totals for this month's income and projected future income on the home screen.

### 🤖 Telegram Bot
* **`/agenda` Command**: Lists the next 10 upcoming lessons with student name, date, and time.
* **`/income` Command**: Generates a full income report for the current billing period with per-transaction detail.
* **Lesson Reminders**: Automatically fires Telegram messages before each lesson based on the reminder settings configured in the web app.
* **Live Data**: Bot reads directly from Firestore — always in sync with the web dashboard.

---

## 🛠 Tech Stack

### Web Dashboard (`Private-Tutor-CRM/`)
* **Framework**: React 19 (Vite)
* **Styling**: Tailwind CSS + Lucide React icons
* **Database**: Firebase Firestore (real-time `onSnapshot` listeners)
* **Authentication**: Firebase Auth (Google sign-in)
* **Deployment**: Vercel

### Telegram Bot (`Private-Tutor-CRM-Bot/`)
* **Runtime**: Node.js + Express (health-check endpoint)
* **Firebase Access**: firebase-admin SDK (server-side Firestore)
* **Telegram API**: Polling via `getUpdates` (no webhook)
* **Deployment**: Render (background worker)

---

## 📂 Project Structure

```text
Private-Tutor/
├── Private-Tutor-CRM/          # React web dashboard
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── CalendarView.jsx
│   │   │   ├── LessonForm.jsx  # Scheduling form (single/bulk/block)
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── GradingForm.jsx # TA/grading income entry
│   │   │   ├── GradingsList.jsx
│   │   │   ├── StudentDetails.jsx
│   │   │   ├── LessonDetails.jsx
│   │   │   ├── PricingManager.jsx
│   │   │   ├── CoursesManager.jsx
│   │   │   ├── Button.jsx
│   │   │   └── Input.jsx
│   │   ├── pages/
│   │   │   ├── StudentsPage.jsx  # Main view (students, calendar, gradings, stats)
│   │   │   ├── StatsPage.jsx     # Monthly financial reports
│   │   │   └── LoginPage.jsx
│   │   ├── lib/
│   │   │   ├── firebase.js       # Firebase app init
│   │   │   ├── storage.js        # All Firestore read/write logic
│   │   │   ├── pricing.js        # Price calculation by level & student count
│   │   │   └── telegram.js
│   │   ├── App.jsx               # Auth wrapper + auto-charge loop
│   │   └── main.jsx
│   ├── public/                   # PWA icons + manifest
│   └── vite.config.js
│
└── Private-Tutor-CRM-Bot/       # Telegram bot service
    └── index.js                  # Express server + polling loop + reminder engine
```

---

## 🏗️ Architecture Notes

* **`storage.js`**: Central data layer — all Firestore reads and writes go through here. Real-time views use `onSnapshot`; one-off reads use `getDocs`.
* **`recalculateStudentBalance`**: Called after every lesson or payment mutation. Recomputes balance from scratch (total paid − total past lesson cost) to stay consistent.
* **Auto-charge loop (`App.jsx`)**: On login, a `setInterval` fires every 10 seconds and batch-charges any lessons whose start time has passed and `isCharged` is still `false`. This keeps balances current even if the user navigates away.
* **`pricing.js`**: Price is a function of level tier, number of students in the session, and duration. Academic tier uses a stepped rate (first hour higher than subsequent hours).
* **Bot polling**: The bot uses long-poll `getUpdates` every 3 seconds for commands and a 1-minute tick for reminder checks. Sent reminders are cached in memory (with a 1-hour TTL) to prevent duplicate messages.
* **Billing cycle**: The monthly report runs from the 10th to the 10th of the next month. If today is before the 10th, the previous month's cycle is shown by default.
* **Single-user auth**: Firebase Auth gates all data. Every Firestore document is scoped by `userId`, so the same database could support multiple tutors.

---

## 🗺️ Roadmap

- [x] Student management with level tiers and balance tracking
- [x] Lesson scheduling (online/frontal, single/bulk/recurring)
- [x] Schedule blocking (one-time and recurring)
- [x] Conflict detection on lesson creation
- [x] Auto-charge past lessons via polling loop
- [x] Payment logging with multiple payment methods
- [x] Grading & TA income tracking
- [x] Monthly cash-flow reports with income breakdown
- [x] Future income forecast
- [x] Telegram bot with `/agenda` and `/income` commands
- [x] Per-lesson configurable Telegram reminders
- [x] Dark mode
- [ ] Push notifications / service worker for PWA
- [ ] Student-facing summary view
- [ ] Export report to PDF / CSV
- [ ] Multi-user support with per-tutor isolation

---

## ⚙️ Development Setup

```bash
# Web Dashboard
cd Private-Tutor-CRM
npm install
npm run dev          # Starts Vite dev server at localhost:5173

# Deploy to Vercel (from Private-Tutor-CRM/)
npx vercel --prod

# Telegram Bot
cd Private-Tutor-CRM-Bot
npm install
TELEGRAM_TOKEN=<token> CHAT_ID=<chat_id> node index.js
```

> **Firebase config**: The web app reads Firebase credentials from a `.env` file (Vite `VITE_*` variables). The bot reads from `serviceAccountKey.json`. Neither file is committed to the repository.

> **Firestore rules**: The database uses Firebase Auth-gated rules. Each document requires `userId == request.auth.uid` for reads and writes.

> **Monorepo deployment**: Vercel must be configured with **Root Directory = `Private-Tutor-CRM`**. Render must be configured with **Root Directory = `Private-Tutor-CRM-Bot`**. If migrating from separate repos, remove the nested `.git` folders inside each sub-directory before pushing to the monorepo.

---

## 📄 License

**Personal Initiative Project**

Copyright © 2025 Ziv Gohasi.
