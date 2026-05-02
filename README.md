# EXAM CLOUD

A professional, cloud-powered medical examination platform built with **React**, **Vite**, and **Google Apps Script**.

## 🚀 Overview
EXAM CLOUD transforms the traditional static exam experience into a robust, centralized, and secure assessment ecosystem. By leveraging **Google Sheets** as a database and **Google Apps Script** as a backend API, it provides a seamless cross-device experience without sacrificing the simplicity of serverless hosting.

## ✨ Key Features

### 🛡️ Secure Cloud Backend
- **Authentication**: JWT-based secure login and registration system.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Students and Administrators.
- **Google Sheets Database**: Transparent, accessible, and high-availability data storage.

### 🎓 Advanced Exam Runner
- **Dual Display Modes**: Toggle between focused **Single Question** view and comprehensive **Full Page** view.
- **Session Control**: Pause/Resume timer functionality for flexible test-taking.
- **Smart Retries**: Redo entire exams or target only the questions you missed.
- **Snapshot Persistence**: Historical results preserve the exact question state at the time of the attempt.

### 🛠️ Professional Admin Suite
- **System Dashboard**: Real-time KPI monitoring (Users, Exams, Attempts, Accuracy).
- **User Management**: Grant PRO status, manage roles (Admin/Student), and block/unblock accounts.
- **MCQ Parser**: Rapidly create public exams by pasting raw text; auto-detects questions, options, and keys.
- **Audit Trail**: Track every submission across the entire platform.

### 💎 Premium User Experience
- **PRO vs FREE Plans**: Built-in subscription model with attempt limits for trial users.
- **Modern Aesthetics**: Sleek glassmorphism design using a custom Slate & Indigo palette.
- **Zero-Local Leak**: No exam data is stored in `localStorage`, ensuring data integrity and security.

## 🛠️ Technical Stack
- **Frontend**: React 18, Vite, TypeScript, Lucide Icons.
- **Styling**: Vanilla CSS with modern tokens and utility classes.
- **Backend**: Google Apps Script (Version 3.0).
- **Database**: Google Sheets (Users, Sessions, Exams, Attempts, AuditLog).
- **Hosting**: Cloudflare Pages / GitHub Pages.

## 🔧 Deployment Guide

### 1. Apps Script Setup
1. Create a new Google Sheet.
2. Open **Extensions > Apps Script**.
3. Copy the content of `google-apps-script/Code.gs` into the editor.
4. Set the `ADMIN_PASSWORD` and `JWT_SECRET` variables.
5. Deploy as **Web App** (Execute as: Me, Access: Anyone).
6. Note the provided Deployment URL.

### 2. Frontend Configuration
1. Clone the repository.
2. Create/Update environment variables (e.g., in Cloudflare dashboard):
   - `VITE_APPS_SCRIPT_API_URL`: [Your Apps Script Deployment URL]
3. Run `npm install` and `npm run dev`.

## 📦 Maintenance
- **Database**: All data is stored in the `Exams` and `Users` tabs of your linked Google Sheet.
- **Migrations**: Version 3.0 includes an automatic schema migration tool within `Code.gs`.

---
*Built with ❤️ for Medical Professionals.*
