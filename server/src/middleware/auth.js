const jwt = require('jsonwebtoken');
const { query, config: dbConfig } = require('../config/database');
const { supabaseAdmin, isSupabaseEnabled } = require('../config/supabase');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    // Check if we're in Supabase-only mode
    if (dbConfig && dbConfig.useSupabase) {
      // In Supabase-only mode, never fall back to SQL pool
      if (!isSupabaseEnabled() || !supabaseAdmin) {
        console.error('Supabase-only mode configured but admin client not available');
        return res.status(500).json({
          error: 'Server misconfiguration',
          message: 'Database client not available in Supabase-only mode'
        });
      }

      console.log('Auth: Using Supabase admin client for user verification');
      // Use Supabase to verify user
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, role, is_verified')
        .eq('id', decoded.userId)
        .single();

      if (userError || !userData) {
        console.log('Auth: User not found in Supabase:', userError?.message);
        return res.status(401).json({
          error: 'Invalid token',
          message: 'User not found'
        });
      }

      if (!userData.is_verified) {
        return res.status(401).json({
          error: 'Account not verified',
          message: 'Your account is not verified'
        });
      }

      req.user = {
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        role: userData.role
      };

    } else {
      // Non-Supabase mode: use PostgreSQL pool
      console.log('Auth: Using PostgreSQL pool for user verification');
      const result = await query(
        'SELECT id, first_name, last_name, email, role, is_verified FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'User not found'
        });
      }

      const user = result.rows[0];

      if (!user.is_verified) {
        return res.status(401).json({
          error: 'Account not verified',
          message: 'Your account is not verified'
        });
      }

      req.user = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      };
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Please provide a valid access token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication'
    });
  }
};

// Require admin role
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in first'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      error: 'Authorization failed',
      message: 'An error occurred during authorization'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if we're in Supabase-only mode
      if (dbConfig && dbConfig.useSupabase) {
        if (isSupabaseEnabled() && supabaseAdmin) {
          // Use Supabase to verify user
          const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, email, role, is_verified')
            .eq('id', decoded.userId)
            .single();

          if (!userError && userData && userData.is_verified) {
            req.user = {
              id: userData.id,
              first_name: userData.first_name,
              last_name: userData.last_name,
              email: userData.email,
              role: userData.role
            };
          }
        }
      } else {
        // Non-Supabase mode: use PostgreSQL pool
        const result = await query(
          'SELECT id, first_name, last_name, email, role, is_verified FROM users WHERE id = $1',
          [decoded.userId]
        );

        if (result.rows.length > 0 && result.rows[0].is_verified) {
          const user = result.rows[0];
          req.user = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role
          };
        }
      }
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      type: 'refresh'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  generateAccessToken,
  generateRefreshToken
};