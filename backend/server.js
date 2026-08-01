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
  origin: process.env.CORS_ORIGINS ? JSON.parse(process.env.CORS_ORIGINS) : ['http://localhost:3000', 'http://localhost:8000'],
  credentials: true
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
