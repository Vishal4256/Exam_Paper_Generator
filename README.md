# Exam & Question Paper Generator

An AI-powered web application for generating, managing, and exporting examination question papers.

## 🚀 Overview

This project is a full-stack solution designed to help educators and institutions seamlessly create exams and question papers. By integrating powerful AI capabilities, the platform simplifies question generation, manages exam templates, and provides seamless exporting and sharing functionalities.

## 🌟 Key Features

*   **AI-Assisted Question Generation**: Leverage AI models (OpenAI/Google Gemini) to automatically generate diverse and high-quality questions.
*   **Exam & Question Management**: Create, edit, and organize individual questions and full question papers.
*   **Template Support**: Save and reuse exam templates for standardized test formatting.
*   **Secure Authentication**: User sign-up, login, and secure session management using JWT and bcrypt.
*   **Export Options**: Generate and download question papers in high-quality PDF format.
*   **Email Integration**: Send exams or notifications directly to users via email.

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 19 with Vite
*   **Styling**: Tailwind CSS & Framer Motion for smooth animations
*   **Routing**: React Router DOM
*   **Export Utilities**: html2canvas & jsPDF for client-side PDF rendering
*   **Icons & Charts**: Lucide React & Recharts

### Backend
*   **Environment**: Node.js & Express.js
*   **Database**: MongoDB (via Mongoose)
*   **Authentication**: JSON Web Tokens (JWT) & bcrypt for password hashing
*   **AI Integration**: `@google/genai` and `openai` SDKs
*   **Utilities**: `multer` for file uploads, `pdfkit` for server-side PDF generation, and `nodemailer` for email services.

## 📂 Project Structure

*   `/Frontend` - Contains the React application and UI components.
*   `/Backend` - Contains the Node.js Express server, database models, and API routes.

## 🚀 Getting Started

### Prerequisites
*   Node.js installed
*   MongoDB instance (local or Atlas)
*   API keys for AI services (OpenAI/Google Gemini)

### Backend Setup
1.  Navigate to the `Backend` directory.
2.  Run `npm install` to install dependencies.
3.  Copy `.env.example` to `.env` and configure your environment variables (Database URI, JWT secret, AI API keys).
4.  Run `npm run dev` to start the backend server.

### Frontend Setup
1.  Navigate to the `Frontend` directory.
2.  Run `npm install` to install dependencies.
3.  Run `npm run dev` to start the frontend development server.

## 📜 License

This project is licensed under the ISC License.
