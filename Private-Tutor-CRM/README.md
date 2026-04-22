# Private Teaching Management System (CRM)

[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Style-Tailwind%20CSS-38B2AC.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-Personal-green.svg)](#license)

The **Web Dashboard** for the Private Tutor CRM ecosystem.
This repository contains the frontend application designed to streamline the workflow of private tutors and independent educators.

It connects to a shared Firestore database, working in tandem with the **Telegram Bot Companion** (hosted in a [separate repository](https://github.com/ZivGohasi57/Private-Tutor-CRM-Bot)) to provide a complete management solution.

---

## 🧠 Core Features

### 🖥️ Web Dashboard (Vercel)
* **Student Management**: Full CRUD operations for student profiles, academic levels, and balance tracking.
* **Smart Scheduling**: Interactive Calendar view with recurring lessons, blocking specific hours, and history tracking.
* **Financial Tracking**: 
  * Real-time balance calculation per student.
  * Payment logging (Bit/PayBox/Cash/Bank Transfer).
  * **Cash-Flow Reports**: Tracks actual money received vs. theoretical lesson value.
* **Task & Grading**: Tracking student assignments, projects, and billing for grading time.
* **Responsive Design**: Mobile-first UI with **Dark Mode** support.

### 🤖 Companion Bot Integration
*This project is built to work alongside the [CRM Bot Service](https://github.com/ZivGohasi57/Private-Tutor-CRM-Bot).*
* **24/7 Availability**: The bot runs as a background service on Render.
* **Smart Commands**: `/agenda` (Upcoming lessons) and `/income` (Financial reports).
* **Automated Reminders**: Pushes notifications for upcoming lessons directly to Telegram.
* **Data Sync**: Changes made in this Dashboard are instantly reflected in the Bot via Firebase.

---

## 🚀 Tech Stack

* **Framework**: React.js (Vite)
* **Styling**: Tailwind CSS + Lucide React
* **Database**: Firebase Firestore (NoSQL)
* **Authentication**: Firebase Auth
* **Deployment**: Vercel

---

## 🗂 Project Structure

```text
.
├── src/
│   ├── components/     # UI Components (Forms, Calendar, Stats)
│   ├── lib/            # Firebase configuration & helper functions
│   ├── pages/          # Application views (Students, Calendar, Stats)
│   ├── App.jsx         # Main router and auth wrapper
│   └── main.jsx        # Entry point
├── public/             # Static assets (Icons, Manifest)
├── tailwind.config.js  # Tailwind styling configuration
└── vite.config.js      # Vite build configuration


```


## 🏗️ Ecosystem Architecture

This system uses a **Decoupled Microservice** approach:

1.  **The Web Dashboard (This Repo):**
    * Runs on **Vercel**.
    * Serves the UI for management and data entry.
    * Handles direct database writes (creating students, logging lessons).

2.  **The Bot Service ([External Repo](https://github.com/ZivGohasi57/Private-Tutor-CRM-Bot)):**
    * Runs on **Render** as a Node.js background service.
    * Listens to the same Firestore database.
    * Performs cron-jobs (reminders) and complex aggregations (reports).

---

## 🧪 Development Philosophy

This project was built as a **personal initiative** to demonstrate full-stack capabilities, separating concerns between a responsive frontend and a logic-heavy backend bot.

Key achievements include:
* **Data Consistency**: Ensuring the Bot and the Web App always show the same data from Firestore.
* **Real-time UX**: Leveraging Firestore for instant updates across devices.
* **Secure Architecture**: Separation of client-side logic (React) from server-side secrets (Bot).

---

## 🗺️ Roadmap

- [x] Basic CRUD for Students and Lessons
- [x] Calendar View & Recurring Events
- [x] Financial Reports (Cash & Accrual basis)
- [x] Separation of concerns (Web App vs. Bot Service)

---

## 📄 License

**Personal Initiative Project**

Copyright (c) 2025 Ziv Gohasi.
