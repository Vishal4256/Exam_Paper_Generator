import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './src/swagger.js';

// Load environment variables before anything else
dotenv.config();

import connectDB from './src/db/connection.db.js';

import authRoutes from './src/routes/auth.route.js';
import questionRoutes from './src/routes/questions.route.js';
import examRoutes from './src/routes/Exam.route.js';
import aiRoutes from './src/routes/ai.route.js';
import templateRoutes from './src/routes/template.route.js';
import settingsRoutes from './src/routes/settings.route.js';
import userRoutes from './src/routes/user.route.js';
import contactRoutes from './src/routes/contact.route.js';
import importRoutes from './src/routes/importRoutes.js';
import jobRoutes from './src/routes/jobRoutes.js';
import draftRoutes from './src/routes/draftRoutes.js';
import historyRoutes from './src/routes/historyRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import analyticsRoutes from './src/routes/analytics.route.js';

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

import { generalLimiter, uploadLimiter } from './src/middleware/rateLimiter.js';

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

// ======================
// API Routes
// ======================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes); // Auth limiter applied inside auth.route.js
app.use('/api/import', generalLimiter, importRoutes);
app.use('/api/questions', generalLimiter, questionRoutes);
app.use('/api/exams', generalLimiter, examRoutes);
app.use('/api/ai', generalLimiter, aiRoutes);
app.use('/api/templates', generalLimiter, templateRoutes);
app.use('/api/settings', generalLimiter, settingsRoutes);
app.use('/api/users', generalLimiter, userRoutes);
app.use('/api/contact', generalLimiter, contactRoutes);
app.use('/api/jobs', generalLimiter, jobRoutes);
app.use('/api/drafts', generalLimiter, draftRoutes);
app.use('/api/history', generalLimiter, historyRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/analytics', generalLimiter, analyticsRoutes);

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