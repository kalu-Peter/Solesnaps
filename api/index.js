// Serverless API handler for Vercel
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import your existing server routes
const authRoutes = require('../server/src/routes/auth');
const productRoutes = require('../server/src/routes/products');
const orderRoutes = require('../server/src/routes/orders');
const cartRoutes = require('../server/src/routes/cart');
const userRoutes = require('../server/src/routes/users');
const imageRoutes = require('../server/src/routes/images');
const deliveryRoutes = require('../server/src/routes/delivery');
const adminRoutes = require('../server/src/routes/admin');
const debugRoutes = require('../server/src/routes/debug');
const couponsRoutes = require('../server/src/routes/coupons');

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:8090',
    'https://solesnaps.vercel.app', // Replace with your actual domain
    'http://localhost:8090',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'server', 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/admin', adminRoutes);
app.use('/api', imageRoutes);
app.use('/api/_debug', debugRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
});

// Default API response
app.get('/api', (req, res) => {
  res.json({
    message: 'SoleSnaps API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

module.exports = app;