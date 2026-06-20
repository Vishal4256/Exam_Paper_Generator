import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './src/db/connection.db.js';

import authRoutes from './src/routes/auth.route.js';
import questionRoutes from './src/routes/questions.route.js';
import examRoutes from './src/routes/Exam.route.js';
import aiRoutes from './src/routes/ai.route.js';
import templateRoutes from './src/routes/template.route.js';
import settingsRoutes from './src/routes/settings.route.js';
import userRoutes from './src/routes/user.route.js';
import contactRoutes from './src/routes/contact.route.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// Connect Database
// ======================
connectDB();

// ======================
// Middleware
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// CORS
// ======================
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://examflow512.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-auth-token'
    ]
  })
);

// ======================
// Static Files
// ======================
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ======================
// Root Route
// ======================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ExamFlow Backend Running Successfully 🚀'
  });
});

// ======================
// Health Check
// ======================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Server is running'
  });
});

import { createTransporter } from './src/utils/emailService.js';

// ======================
// SMTP Startup Verification & Audit
// ======================
const verifySMTPAtStartup = async () => {
  console.log("=== STARTUP SMTP AUDIT ===");
  console.log("SMTP_HOST exists?", !!process.env.SMTP_HOST, process.env.SMTP_HOST ? 'Present' : 'Missing');
  console.log("SMTP_PORT exists?", !!process.env.SMTP_PORT, process.env.SMTP_PORT ? 'Present' : 'Missing');
  console.log("SMTP_USER exists?", !!process.env.SMTP_USER, process.env.SMTP_USER ? 'Present' : 'Missing');
  console.log("SMTP_PASS exists?", !!process.env.SMTP_PASS, process.env.SMTP_PASS ? '(hidden)' : 'Missing');
  console.log("Checking if Gmail App Password is being used...");
  if (process.env.SMTP_PASS && process.env.SMTP_PASS.length === 16 && !process.env.SMTP_PASS.includes(' ')) {
      console.log("✅ SMTP_PASS appears to be a valid 16-character App Password format.");
  } else if (process.env.SMTP_PASS) {
      console.log("❌ WARNING: SMTP_PASS does not look like a 16-character App Password without spaces. This may cause EAUTH errors.");
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ NodeMailer Transporter Verified Successfully at Startup!");
  } catch (error) {
    console.error("❌ SMTP Verification Failed at Startup!");
    console.error("Error Code:", error.code);
    console.error("Exact Error:", error.message);
    if (error.code === 'EAUTH') {
        console.error("ROOT CAUSE: Authentication Failed. FIX: Use a 16-character Google App Password in your Render environment variables.");
    } else if (error.code === 'ETIMEDOUT') {
        console.error("ROOT CAUSE: Connection Timeout. FIX: Ensure SMTP_PORT is 465 (secure: true) or 587 (secure: false). Check Render outbound firewall.");
    }
  }
  console.log("==========================\n");
};
verifySMTPAtStartup();

// ======================
// API Routes
// ======================
app.get('/api/debug/email', async (req, res) => {
  try {
    const transporter = createTransporter();
    
    // Test 1: Verify Connection
    await transporter.verify();
    
    // Test 2: Send Email
    const info = await transporter.sendMail({
      from: `ExamFlow Debug <${process.env.SMTP_USER}>`,
      to: 'vishal42564256@gmail.com',
      subject: 'SMTP Audit Test - ExamFlow',
      text: 'This is a test email triggered from /api/debug/email to verify the SMTP configuration on Render.'
    });

    res.status(200).json({
      success: true,
      message: "SMTP connection successful and test email sent!",
      messageId: info.messageId,
      envAudit: {
        host: !!process.env.SMTP_HOST,
        port: !!process.env.SMTP_PORT,
        user: !!process.env.SMTP_USER,
        pass: !!process.env.SMTP_PASS,
        passLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0
      }
    });
  } catch (error) {
    let fix = "Check configuration.";
    if (error.code === 'EAUTH') fix = "Use a 16-character Google App Password in your Render environment variables.";
    if (error.code === 'ETIMEDOUT') fix = "Ensure SMTP_PORT is 465 or 587.";

    res.status(500).json({
      success: false,
      error: "SMTP Error",
      code: error.code,
      exactMessage: error.message,
      rootCause: error.code,
      fix: fix,
      envAudit: {
        host: !!process.env.SMTP_HOST,
        port: !!process.env.SMTP_PORT,
        user: !!process.env.SMTP_USER,
        pass: !!process.env.SMTP_PASS
      }
    });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);

// ======================
// 404 Handler
// ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ======================
// Global Error Handler
// ======================
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ======================
// Start Server
// ======================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `🌍 Environment: ${process.env.NODE_ENV || 'development'}`
  );
});