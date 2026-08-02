import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import invoiceRoutes from './src/routes/invoices.js';
import dashboardRoutes from './src/routes/dashboard.js';
import searchRoutes from './src/routes/search.js';

// Load env first
dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  maxAge: 3600
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/search', searchRoutes);

app.get('/api/v1', (req, res) => {
  res.json({
    status: 'ok',
    message: 'InvoiceGuard AI API v1',
    endpoints: {
      auth: '/api/v1/auth',
      invoices: '/api/v1/invoices',
      dashboard: '/api/v1/dashboard',
      health: '/health'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'InvoiceGuard AI API' });
});

app.get('/', (req, res) => {
  res.json({ message: 'InvoiceGuard AI API', docs: '/docs' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`✓ Node backend running on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ API endpoints: http://localhost:${PORT}/api/v1`);
  console.log(`✓ Supabase integrated`);
});
