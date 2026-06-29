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
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ NodeMailer Transporter Verified Successfully at Startup!");
  } catch (error) {
    console.warn("⚠️ SMTP Verification Failed at Startup, continuing anyway.");
    console.warn("Error Code:", error.code);
    console.warn("Exact Error:", error.message);
  }
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
      from: `"${process.env.APP_NAME || 'ExamFlow Debug'}" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // sending to self for testing
      subject: 'SMTP Audit Test - ExamFlow',
      text: 'This is a test email triggered from /api/debug/email to verify the SMTP configuration on Render.'
    });

    res.status(200).json({
      success: true,
      provider: "gmail",
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || error.toString(),
      code: error.code
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