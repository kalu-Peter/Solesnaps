const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('express-async-errors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { testConnection } = require('./config/database');
const { findAvailablePort, getPortProcess } = require('./utils/portUtils');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const userRoutes = require('./routes/users');
const imageRoutes = require('./routes/images');
const deliveryRoutes = require('./routes/delivery');
const adminRoutes = require('./routes/admin');
const debugRoutes = require('./routes/debug');
const couponsRoutes = require('./routes/coupons');

const app = express();
const PREFERRED_PORT = parseInt(process.env.PORT) || 8080;
// Restart trigger

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - more permissive for development
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 1000, // increased from 100 to 1000 for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:8081',
    process.env.ADMIN_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  });
});

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

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'TechStyle API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      cart: '/api/cart',
      users: '/api/users',
      delivery: '/api/delivery',
      health: '/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.message
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  if (error.code === '23505') { // PostgreSQL unique constraint error
    return res.status(409).json({
      error: 'Resource already exists',
      details: 'A record with this information already exists'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
const gracefulShutdown = (server) => (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connections
    require('./config/database').closePool().then(() => {
      console.log('✅ Database connections closed');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    });
  });
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️ Database connection failed. Server will start without database.');
      console.warn('⚠️ Please ensure PostgreSQL is running and the database exists.');
    }

    // Find available port
    let PORT;
    try {
      PORT = await findAvailablePort(PREFERRED_PORT);
      
      if (PORT !== PREFERRED_PORT) {
        console.log(`⚠️  Port ${PREFERRED_PORT} is in use, using port ${PORT} instead`);
        
        // Try to get information about what's using the preferred port
        const processInfo = await getPortProcess(PREFERRED_PORT);
        if (processInfo) {
          console.log(`🔍 Port ${PREFERRED_PORT} is being used by: ${processInfo}`);
        }
      }
    } catch (error) {
      console.error('❌ Could not find available port:', error.message);
      process.exit(1);
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`
🚀 TechStyle API Server Started
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server: http://localhost:${PORT}
🔗 API Base: http://localhost:${PORT}/api
💾 Database: PostgreSQL on port ${process.env.DB_PORT || '5054'}
      `);
    });

    // Handle server startup errors
    server.on('error', async (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is still in use. This shouldn't happen with our port checking logic.`);
        console.error('❌ There might be a race condition or another server starting up.');
        
        // Try to find another port as fallback
        try {
          console.log('🔄 Attempting to find another available port...');
          const fallbackPort = await findAvailablePort(PORT + 1);
          console.log(`🆘 Trying fallback port: ${fallbackPort}`);
          
          const fallbackServer = app.listen(fallbackPort, () => {
            console.log(`
🚀 TechStyle API Server Started (Fallback)
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server: http://localhost:${fallbackPort}
🔗 API Base: http://localhost:${fallbackPort}/api
💾 Database: PostgreSQL on port ${process.env.DB_PORT || '5054'}
            `);
          });
          
          const shutdown = gracefulShutdown(fallbackServer);
          process.on('SIGTERM', () => shutdown('SIGTERM'));
          process.on('SIGINT', () => shutdown('SIGINT'));
          
        } catch (fallbackError) {
          console.error('❌ Could not start server on any port:', fallbackError.message);
          process.exit(1);
        }
      } else {
        console.error('❌ Server startup error:', error);
        process.exit(1);
      }
    });

    // Handle graceful shutdown
    const shutdown = gracefulShutdown(server);
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;