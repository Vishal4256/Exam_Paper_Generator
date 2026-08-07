# ExamFlow - AI-Powered Exam Management Platform

![Version](https://img.shields.io/badge/version-v2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build](https://img.shields.io/badge/build-passing-success.svg)

ExamFlow is a comprehensive, production-ready AI-powered exam management and generation platform built on the MERN stack. It empowers educators and institutions to efficiently manage question banks, import bulk data, and dynamically generate balanced exam papers with rich formatting.

---

# Live Demo

**Frontend:**
https://your-frontend.vercel.app

**Backend API:**
https://your-backend.onrender.com

**API Docs:**
/api-docs

---

## Features

* Authentication
* Question Bank
* Rich Text Editor
* Import Wizard
* Blueprint Analyzer
* Question Quality Analyzer
* Analytics Dashboard
* AI Health Center
* PDF Export
* Draft Management
* Bulk Operations
* Advanced Search

---

## Screenshots

*Note: Replace with actual screenshots when recorded.*

* **Dashboard**: `![Dashboard](docs/screenshots/dashboard.png)`
* **Question Bank**: `![Question Bank](docs/screenshots/question-bank.png)`
* **Generate Exam**: `![Generate Exam](docs/screenshots/generate-exam.png)`
* **Analytics**: `![Analytics](docs/screenshots/analytics.png)`
* **Blueprint Analyzer**: `![Blueprint Analyzer](docs/screenshots/editor.png)`
* **Rich Editor**: `![Rich Editor](docs/screenshots/editor.png)`
* **Import Wizard**: `![Import Wizard](docs/screenshots/import.png)`

---

## 🏗️ Architecture

ExamFlow uses a robust MERN stack architecture with AI enhancements. 
For detailed architecture and database schema, see:
- [High-Level Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)

---

## 🛠️ Environment Setup

### Frontend
```bash
cp .env.example .env
```
Then replace the placeholder values with your own credentials.

### Backend
```bash
cp .env.example .env
```
Then replace the placeholder values with your own credentials.

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ExamFlow.git
   cd ExamFlow
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

## 🌍 Deployment

- **Frontend:** Optimized for Vercel. Run `npm run build` to generate the static `dist/` folder.
- **Backend:** Designed for Render or Heroku. The backend is completely stateless during imports and relies on MongoDB for persistence.

## 📖 Documentation

- [API Reference](docs/API_REFERENCE.md)
- [Interview Guide](docs/INTERVIEW_GUIDE.md)
- [Portfolio Case Study](docs/PORTFOLIO_CASE_STUDY.md)
- [Future Roadmap](docs/ROADMAP.md)
