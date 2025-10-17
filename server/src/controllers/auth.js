const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { supabaseAdmin, isSupabaseEnabled } = require('../config/supabase');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');

// Register a new user
const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Use Supabase for user creation
      console.log('Creating user with Supabase...');
      
      // First, create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for development
        user_metadata: {
          first_name,
          last_name
        }
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        return res.status(400).json({
          error: 'Registration failed',
          message: authError.message
        });
      }

      // Then create user profile in Supabase database
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          auth_id: authData.user.id,
          email,
          first_name,
          last_name,
          role: 'customer',
          is_verified: true
        })
        .select()
        .single();

      if (profileError) {
        console.error('Supabase profile creation error:', profileError);
        // Try to clean up the auth user if profile creation failed
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({
          error: 'Registration failed',
          message: profileError.message
        });
      }

      console.log('User created successfully in Supabase');

      // Generate JWT tokens for our app
      const user = {
        id: profileData.id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        role: profileData.role
      };

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: profileData.id,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          role: profileData.role,
          created_at: profileData.created_at
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken
        }
      });

    } else {
      // Fallback to local PostgreSQL
      console.log('Creating user with local PostgreSQL...');
      
      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user (auto-verified for development)
      const result = await query(
        `INSERT INTO users (first_name, last_name, email, password, role, is_verified) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, first_name, last_name, email, role, is_verified, created_at`,
        [first_name, last_name, email, hashedPassword, 'customer', true]
      );

      const user = result.rows[0];

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Use Supabase for authentication
      console.log('Authenticating user with Supabase...');
      
      // First, authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Get user profile from Supabase database
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('Supabase profile error:', profileError);
        return res.status(401).json({
          error: 'User profile not found',
          message: 'User profile not found'
        });
      }

      console.log('User authenticated successfully with Supabase');

      // Generate JWT tokens for our app
      const user = {
        id: profileData.id,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        role: profileData.role
      };

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        message: 'Login successful',
        user: {
          id: profileData.id,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          role: profileData.role
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken
        }
      });

    } else {
      // Fallback to local PostgreSQL
      console.log('Authenticating user with local PostgreSQL...');
      
      // Get user from database
      const result = await query(
        'SELECT id, first_name, last_name, email, password, role, is_verified FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Update last login (optional)
      await query(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (isSupabaseEnabled() && supabaseAdmin) {
      // Use Supabase for profile retrieval
      console.log('Getting profile with Supabase...');
      
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, role, phone, date_of_birth, gender, is_verified, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.error('Supabase profile error:', profileError);
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      res.json({
        message: 'Profile retrieved successfully',
        ...profileData
      });

    } else {
      // Fallback to PostgreSQL query
      const result = await query(
        `SELECT id, first_name, last_name, email, role, phone, 
                date_of_birth, gender, is_verified, created_at, updated_at 
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      const user = result.rows[0];

      res.json({
        message: 'Profile retrieved successfully',
        user: user
      });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'An error occurred while retrieving profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone, date_of_birth, gender } = req.body;

    const result = await query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, phone = $3, date_of_birth = $4, gender = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 
       RETURNING id, first_name, last_name, email, role, phone, date_of_birth, gender, updated_at`,
      [first_name, last_name, phone, date_of_birth, gender, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    const user = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      user: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'An error occurred while updating profile'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    // Get current password hash
    const result = await query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password);

    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: 'An error occurred while changing password'
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Refresh token required',
        message: 'Please provide a refresh token'
      });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Invalid refresh token'
      });
    }

    // Get user
    const result = await query(
      'SELECT id, first_name, last_name, email, role, is_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_verified) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or not verified'
      });
    }

    const user = result.rows[0];

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      message: 'Token refreshed successfully',
      tokens: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Invalid or expired refresh token'
      });
    }

    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing token'
    });
  }
};

// Logout (optional - for token blacklisting)
const logout = async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout
};