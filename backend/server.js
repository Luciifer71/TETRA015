import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeSupabase } from './src/config/supabase.js';
import authRoutes from './src/routes/auth.js';
import invoiceRoutes from './src/routes/invoices.js';

// Load env first
dotenv.config({ path: '.env' });

// Initialize Supabase
initializeSupabase();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

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
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ API: http://localhost:${PORT}/api/v1`);
});
