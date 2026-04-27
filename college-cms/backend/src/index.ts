import express from 'express';
import cors from 'cors';
import https from 'https';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import prisma from './utils/prisma';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import studentRoutes from './routes/students';
import courseRoutes from './routes/courses';
import expenseCategoryRoutes from './routes/expenseCategories';
import academicYearRoutes from './routes/academic-years';
import feeComponentRoutes from './routes/fee-components';
import feeStructureRoutes from './routes/fee-structures';
import studentFeeRoutes from './routes/student-fees';
import transactionRoutes from './routes/transactions';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';

import { authenticate } from './middleware/authenticate';
import { authorize } from './middleware/authorize';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy for Render and Rate Limiting
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://adminschs.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 || 
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV === 'development'
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 100,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// --- CRITICAL PULSE ROUTES (Moved to Top) ---
app.get(['/api/health', '/health'], async (req: express.Request, res: express.Response) => {
  try {
    await prisma.$executeRaw`SELECT 1`;
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      db: "connected",
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error: any) {
    console.error('❌ DATABASE CONNECTION ERROR:', error.message);
    res.status(503).json({ 
      status: "error", 
      db: "disconnected",
      reason: process.env.NODE_ENV === 'development' ? error.message : "Internal database error"
    });
  }
});

// Apply limiters to other routes
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/fee-components', feeComponentRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/student-fees', studentFeeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/logs', authenticate, authorize('SUPER_ADMIN'), async (req: express.Request, res: express.Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

// Basic Root Route
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ message: 'SCHS Pharmacy College CMS API Active' });
});

// Start Server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Keep-Alive Mechanism (Self-Ping every 14 minutes)
    const url = process.env.RENDER_EXTERNAL_URL;
    if (url && url.startsWith('https')) {
      setInterval(() => {
        https.get(`${url}/api/health`, (res) => {
          console.log(`📡 SCHS Pulse: Status ${res.statusCode} | ✅ Keep-Alive Recorded.`);
        }).on('error', (err) => {
          console.error('❌ Keep-Alive Pulse Error');
        });
      }, 14 * 60 * 1000); 
    }
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
