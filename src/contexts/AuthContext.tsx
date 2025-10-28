import React, { createContext, useContext, useState, useEffect } from "react";
import { supabaseAuth, supabaseDb } from "../lib/supabase";

interface User {
  id: string; // UUID string instead of number
  first_name: string;
  last_name: string;
  email: string;
  role: "customer" | "admin";
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: string;
}

// Helper function to get full name
const getFullName = (user: User | null): string => {
  if (!user) return "";
  return `${user.first_name} ${user.last_name}`.trim();
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  getFullName: () => string;
  refreshToken: () => Promise<boolean>;
  login: (
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    userData: RegisterData
  ) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    userData: UpdateProfileData
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  password: string;
}

interface UpdateProfileData {
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = "/api";

  // Helper function to ensure user exists in database and return the correct user record
  const ensureUserInDatabase = async (supabaseUser: any) => {
    try {
      console.log("Checking if user exists in database:", supabaseUser.id);

      const { supabase } = await import("../lib/supabase");
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      // First, check if user exists by auth_id (most likely scenario)
      console.log("Checking for existing user by auth_id...");
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id, auth_id, email, first_name, last_name")
        .eq("auth_id", supabaseUser.id)
        .single();

      if (existingUser && !checkError) {
        console.log("Found existing user by auth_id:", existingUser);
        return existingUser;
      }

      // If not found by auth_id, check by email (backup check)
      console.log("User not found by auth_id, checking by email...");
      const { data: userByEmail, error: emailError } = await supabase
        .from("users")
        .select("id, auth_id, email, first_name, last_name")
        .eq("email", supabaseUser.email)
        .single();

      if (userByEmail && !emailError) {
        console.log("Found existing user by email:", userByEmail);

        // Update the auth_id if it's missing or different
        if (userByEmail.auth_id !== supabaseUser.id) {
          console.log("Updating user record with correct auth_id...");
          const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({ auth_id: supabaseUser.id })
            .eq("id", userByEmail.id)
            .select()
            .single();

          if (updateError) {
            console.error("Failed to update user auth_id:", updateError);
          } else {
            console.log("User auth_id updated successfully:", updatedUser);
            return updatedUser;
          }
        }

        return userByEmail;
      }

      // If no existing user found, create new user record
      console.log("No existing user found, creating new user record...");
      const userDataForDb = {
        id: supabaseUser.id, // Use Supabase Auth ID as primary key
        auth_id: supabaseUser.id,
        email: supabaseUser.email,
        first_name: supabaseUser.user_metadata?.first_name || "",
        last_name: supabaseUser.user_metadata?.last_name || "",
        phone: supabaseUser.user_metadata?.phone || null,
        role: supabaseUser.user_metadata?.role || "customer",
        date_of_birth: supabaseUser.user_metadata?.date_of_birth || null,
        gender: supabaseUser.user_metadata?.gender || null,
      };

      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert(userDataForDb)
        .select()
        .single();

      if (createError) {
        console.error("Failed to create user:", createError);
        throw createError;
      }

      console.log("New user record created:", newUser);
      return newUser;
    } catch (error) {
      console.error("Error ensuring user in database:", error);
      throw error;
    }
  }; // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("auth_user");

        if (storedToken && storedUser) {
          // Parse stored user data
          const userData = JSON.parse(storedUser);

          // Set token and user immediately for immediate UI update
          setToken(storedToken);
          setUser(userData);

          // Restore Supabase session if available
          const storedSession = localStorage.getItem("supabase_session");
          if (storedSession) {
            try {
              const session = JSON.parse(storedSession);
              // Import supabase client directly for session restoration
              const { supabase } = await import("../lib/supabase");
              if (supabase) {
                await supabase.auth.setSession(session);
                console.log("Supabase session restored");
              }
            } catch (error) {
              console.error("Failed to restore Supabase session:", error);
            }
          }

          // Verify session is still valid using Supabase
          try {
            const { supabase } = await import("../lib/supabase");
            if (supabase) {
              const {
                data: { user: currentUser },
                error,
              } = await supabase.auth.getUser();

              if (error || !currentUser) {
                console.log("Session invalid, clearing auth data");
                clearAuthData();
              } else {
                // Session is valid, user data is already set above
                console.log("Session verified successfully");
              }
            }
          } catch (sessionError) {
            console.error("Session verification error:", sessionError);
            // Network error - keep existing session but don't clear it
            // User might be offline
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    const attemptTokenRefresh = async (
      refreshToken: string
    ): Promise<boolean> => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          const { user: userData, tokens } = data;

          setUser(userData);
          setToken(tokens.access_token);

          // Update localStorage
          localStorage.setItem("auth_token", tokens.access_token);
          localStorage.setItem("auth_user", JSON.stringify(userData));
          localStorage.setItem("refresh_token", tokens.refresh_token);

          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error("Token refresh error:", error);
        return false;
      }
    };

    const clearAuthData = () => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("refresh_token");
      setToken(null);
      setUser(null);
    };

    initAuth();
  }, []);

  const login = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabaseAuth.signIn(identifier, password);

      if (error) {
        console.error("Login error:", error.message);
        return {
          success: false,
          error:
            error.message || "Login failed. Please check your credentials.",
        };
      }

      if (data.user && data.session) {
        console.log("User logged in:", data.user);
        console.log("Session established:", data.session);

        // Ensure user exists in database and get the correct user record
        let dbUser = null;
        try {
          dbUser = await ensureUserInDatabase(data.user);
          console.log("Database user record from login:", dbUser);
        } catch (dbError) {
          console.error("Database user creation error during login:", dbError);
          // Continue anyway as the auth user was created successfully
        }

        // Create user object in the expected format
        // IMPORTANT: Use the database user.id (which references orders.user_id), not the auth_id
        const userData: User = {
          id: dbUser?.id || data.user.id, // Use database user.id if available
          first_name: data.user.user_metadata?.first_name || "",
          last_name: data.user.user_metadata?.last_name || "",
          email: data.user.email || "",
          role: data.user.user_metadata?.role || "customer",
          phone: data.user.user_metadata?.phone,
          avatar_url: data.user.user_metadata?.avatar_url,
          date_of_birth: data.user.user_metadata?.date_of_birth,
          gender: data.user.user_metadata?.gender,
        };

        setUser(userData);
        setToken(data.session.access_token);

        // Store in localStorage
        localStorage.setItem("auth_token", data.session.access_token);
        localStorage.setItem("auth_user", JSON.stringify(userData));
        localStorage.setItem("supabase_session", JSON.stringify(data.session));
        if (data.session.refresh_token) {
          localStorage.setItem("refresh_token", data.session.refresh_token);
        }

        return { success: true };
      } else {
        return {
          success: false,
          error: "Login failed. No session data received.",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    userData: RegisterData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const metadata = {
        first_name: userData.first_name,
        last_name: userData.last_name,
      };

      // If phone is provided, register with phone
      if (userData.phone) {
        const phone = userData.phone.trim();
        // Basic phone validation (international format encouraged)
        const phoneRegex = /^\+?\d{7,15}$/;
        if (!phoneRegex.test(phone)) {
          return {
            success: false,
            error: "Please enter a valid phone number.",
          };
        }

        const { data: authData, error: authError } = await supabaseAuth.signUp(
          phone,
          userData.password,
          metadata
        );

        if (authError) {
          console.error("Supabase phone registration error:", authError);
          return {
            success: false,
            error: authError.message || "Registration failed.",
          };
        }

        if (authData?.user) {
          // For phone signups Supabase may send an OTP (no session). Inform the user.
          if (!authData.session) {
            return {
              success: true,
              error:
                "Registration initiated. Please check your phone for an OTP to complete signup.",
            };
          }

          // If session present, continue like email flow
          let dbUser = null;
          try {
            dbUser = await ensureUserInDatabase(authData.user);
          } catch (dbError) {
            console.error(
              "Database user creation error during phone signup:",
              dbError
            );
          }

          const newUser: User = {
            id: dbUser?.id || authData.user.id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: authData.user.email || "",
            role: "customer",
            phone: authData.user.user_metadata?.phone || phone,
            avatar_url: authData.user.user_metadata?.avatar_url,
            date_of_birth: authData.user.user_metadata?.date_of_birth,
            gender: authData.user.user_metadata?.gender,
          };

          setUser(newUser);
          setToken(authData.session.access_token);
          localStorage.setItem("auth_token", authData.session.access_token);
          localStorage.setItem("auth_user", JSON.stringify(newUser));
          localStorage.setItem(
            "supabase_session",
            JSON.stringify(authData.session)
          );
          if (authData.session.refresh_token) {
            localStorage.setItem(
              "refresh_token",
              authData.session.refresh_token
            );
          }

          return { success: true };
        }

        return { success: false, error: "Phone registration failed." };
      }

      // Otherwise register with email
      if (!userData.email) {
        return {
          success: false,
          error: "Email is required for email registration.",
        };
      }

      const cleanEmail = userData.email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, error: "Please enter a valid email address." };
      }

      const { data: authData, error: authError } = await supabaseAuth.signUp(
        cleanEmail,
        userData.password,
        metadata
      );

      if (authError) {
        console.error("Supabase registration error:", authError);
        return {
          success: false,
          error: authError.message || "Registration failed.",
        };
      }

      if (authData?.user) {
        if (!authData.session && !authData.user.email_confirmed_at) {
          return {
            success: true,
            error:
              "Please check your email and click the confirmation link to complete registration.",
          };
        }

        if (authData.session) {
          let dbUser = null;
          try {
            dbUser = await ensureUserInDatabase(authData.user);
          } catch (dbError) {
            console.error("Database user creation error:", dbError);
          }

          const newUser: User = {
            id: dbUser?.id || authData.user.id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: cleanEmail,
            role: "customer",
            phone: authData.user.user_metadata?.phone,
            avatar_url: authData.user.user_metadata?.avatar_url,
            date_of_birth: authData.user.user_metadata?.date_of_birth,
            gender: authData.user.user_metadata?.gender,
          };

          setUser(newUser);
          setToken(authData.session.access_token);
          localStorage.setItem("auth_token", authData.session.access_token);
          localStorage.setItem("auth_user", JSON.stringify(newUser));
          localStorage.setItem(
            "supabase_session",
            JSON.stringify(authData.session)
          );
          if (authData.session.refresh_token) {
            localStorage.setItem(
              "refresh_token",
              authData.session.refresh_token
            );
          }

          return { success: true };
        } else {
          return {
            success: true,
            error:
              "Registration successful! Please check your email to confirm your account.",
          };
        }
      }

      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: UpdateProfileData) => {
    if (!token) {
      return {
        success: false,
        error: "You must be logged in to update your profile.",
      };
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update user data in state
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);

        // Update localStorage
        localStorage.setItem("auth_user", JSON.stringify(updatedUser));

        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error: data.message || "Profile update failed. Please try again.",
        };
      }
    } catch (error) {
      console.error("Profile update error:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!token) {
      return {
        success: false,
        error: "You must be logged in to change your password.",
      };
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error: data.message || "Password change failed. Please try again.",
        };
      }
    } catch (error) {
      console.error("Password change error:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const storedRefreshToken = localStorage.getItem("refresh_token");
    if (!storedRefreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const { user: userData, tokens } = data;

        setUser(userData);
        setToken(tokens.access_token);

        // Update localStorage
        localStorage.setItem("auth_token", tokens.access_token);
        localStorage.setItem("auth_user", JSON.stringify(userData));
        localStorage.setItem("refresh_token", tokens.refresh_token);

        return true;
      } else {
        // Refresh failed, clear all auth data
        logout();
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return false;
    }
  };

  const logout = async () => {
    // Sign out from Supabase
    try {
      const { error } = await supabaseAuth.signOut();
      if (error) {
        console.error("Supabase logout error:", error);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear local state and storage
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("supabase_session");
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === "admin";

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isLoading,
    getFullName: () => getFullName(user),
    refreshToken,
    login,
    register,
    updateProfile,
    changePassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
