import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Route Imports
import setupRoutes from './routes/setupRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orgRoutes from './routes/orgRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import commsRoutes from './routes/commsRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health / Status Check Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'HCM Lite — Saylani Hackathon API',
    version: '1.0.0',
    modules: [
      'M1: Auth & Access',
      'M2: Organization Setup',
      'M3: Employees (Directory & CSV)',
      'M4: Attendance (Web & Camera GPS)',
      'M5: Leave Management (Smart NLP)',
      'M6: Payroll Lite (Slabs & Locking)',
      'M7: Dashboards & Aggregations',
      'M8: AI Assistant (Tool Calling)',
      'M9: Comms & Immutable Audit Log',
    ],
  });
});

// Mount Routes
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboards', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/comms', commsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 HCM Lite API Server running on: http://localhost:${PORT}`);
  console.log(`🌟 All 9 Hackathon Modules Initialized & Ready`);
  console.log(`=======================================================`);
});
