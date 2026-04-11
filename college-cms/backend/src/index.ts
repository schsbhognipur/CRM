import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import studentRoutes from './routes/students';
import academicYearRoutes from './routes/academic-years';
import feeComponentRoutes from './routes/fee-components';
import feeStructureRoutes from './routes/fee-structures';
import studentFeeRoutes from './routes/student-fees';
import transactionRoutes from './routes/transactions';
import expenseCategoryRoutes from './routes/expense-categories';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import prisma from './utils/prisma';
import { authenticate } from './middleware/authenticate';
import { authorize } from './middleware/authorize';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_WHITELIST ? process.env.CORS_WHITELIST.split(',') : 'http://localhost:5173',
  credentials: true
}));

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again in a minute.' }
});

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Apply limiters
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Health Check
app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    await prisma.$executeRaw`SELECT 1`;
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      db: "connected",
      version: "1.0.0"
    });
  } catch (error) {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/fee-components', feeComponentRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/student-fees', studentFeeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/logs', authenticate, authorize('SUPER_ADMIN'), async (req: express.Request, res: express.Response) => {
  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } }
  });
  res.json(logs);
});

// Basic Route
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ message: 'College CMS API stays active!' });
});

// Start Server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(async () => {
      console.log('HTTP server closed.');
      await prisma.$disconnect();
      console.log('Prisma disconnected. Exit.');
      process.exit(0);
    });
  
    // Force close after 10s
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
});
