const bcrypt = require('bcryptjs');
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
      // Supabase not configured
      console.error('❌ Supabase not configured. Cannot register user.');
      return res.status(500).json({
        error: 'Registration service unavailable',
        message: 'User registration service is not properly configured'
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
      // Supabase not configured
      console.error('❌ Supabase not configured. Cannot authenticate user.');
      return res.status(500).json({
        error: 'Authentication service unavailable',
        message: 'Authentication service is not properly configured'
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
      // Supabase not configured
      console.error('❌ Supabase not configured. Cannot get user profile.');
      return res.status(500).json({
        error: 'Profile service unavailable',
        message: 'User profile service is not properly configured'
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

    if (!isSupabaseEnabled() || !supabaseAdmin) {
      console.error('❌ Supabase not configured. Cannot update profile.');
      return res.status(500).json({
        error: 'Profile service unavailable',
        message: 'Profile update service is not properly configured'
      });
    }

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .update({
        first_name,
        last_name,
        phone,
        date_of_birth,
        gender,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, first_name, last_name, email, role, phone, date_of_birth, gender, updated_at')
      .single();

    if (profileError || !profileData) {
      console.error('Supabase update profile error:', profileError);
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: profileData
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

    if (!isSupabaseEnabled() || !supabaseAdmin) {
      console.error('❌ Supabase not configured. Cannot change password.');
      return res.status(500).json({
        error: 'Password service unavailable',
        message: 'Password change service is not properly configured'
      });
    }

    // Get user auth_id from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('auth_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Supabase user lookup error:', userError);
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Update password using Supabase Auth
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.auth_id,
      { password: new_password }
    );

    if (passwordError) {
      console.error('Supabase password update error:', passwordError);
      return res.status(400).json({
        error: 'Password update failed',
        message: 'Failed to update password'
      });
    }

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
    if (!isSupabaseEnabled() || !supabaseAdmin) {
      console.error('❌ Supabase not configured. Cannot refresh token.');
      return res.status(500).json({
        error: 'Authentication service unavailable',
        message: 'Token refresh service is not properly configured'
      });
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, role, is_verified')
      .eq('id', decoded.userId)
      .single();

    if (userError || !userData || !userData.is_verified) {
      console.error('Supabase user lookup error:', userError);
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or not verified'
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(userData);
    const newRefreshToken = generateRefreshToken(userData);

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