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
    email: string,
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
  email: string;
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

  // Helper function to ensure user exists in database
  const ensureUserInDatabase = async (supabaseUser: any) => {
    try {
      console.log("Checking if user exists in database:", supabaseUser.id);

      // Use upsert instead of separate check and create
      const userDataForDb = {
        id: supabaseUser.id,
        auth_id: supabaseUser.id,
        email: supabaseUser.email,
        first_name: supabaseUser.user_metadata?.first_name || "",
        last_name: supabaseUser.user_metadata?.last_name || "",
        phone: supabaseUser.user_metadata?.phone || null,
        role: supabaseUser.user_metadata?.role || "customer",
        date_of_birth: supabaseUser.user_metadata?.date_of_birth || null,
        gender: supabaseUser.user_metadata?.gender || null,
      };

      // Use direct supabase client with upsert to handle conflicts
      const { supabase } = await import("../lib/supabase");
      if (supabase) {
        const { data, error } = await supabase
          .from("users")
          .upsert(userDataForDb, {
            onConflict: "id",
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (error) {
          console.error("Failed to upsert user:", error);
          throw error;
        }
        console.log("User ensured in database:", data);
      } else {
        throw new Error("Supabase not configured");
      }
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

          // Verify token is still valid by fetching user profile
          try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
              headers: {
                Authorization: `Bearer ${storedToken}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const data = await response.json();
              setUser(data.user);
              // Update localStorage with fresh user data
              localStorage.setItem("auth_user", JSON.stringify(data.user));
            } else if (response.status === 401) {
              // Token expired, try to refresh
              const refreshToken = localStorage.getItem("refresh_token");
              if (refreshToken) {
                const refreshSuccess = await attemptTokenRefresh(refreshToken);
                if (!refreshSuccess) {
                  clearAuthData();
                }
              } else {
                clearAuthData();
              }
            } else {
              // Other error, clear data
              clearAuthData();
            }
          } catch (profileError) {
            console.error("Profile verification error:", profileError);
            // Network error - keep existing token but don't clear it
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
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabaseAuth.signIn(email, password);

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

        // User automatically created by database trigger - no manual sync needed

        // Create user object in the expected format
        const userData: User = {
          id: data.user.id, // Keep as string UUID
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

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        const { user: newUser, tokens } = data;

        setUser(newUser);
        setToken(tokens.access_token);

        // Store in localStorage
        localStorage.setItem("auth_token", tokens.access_token);
        localStorage.setItem("auth_user", JSON.stringify(newUser));
        localStorage.setItem("refresh_token", tokens.refresh_token);

        return { success: true };
      } else {
        return {
          success: false,
          error: data.message || "Registration failed. Please try again.",
        };
      }
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

  const logout = () => {
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("refresh_token");

    // Optional: Call logout endpoint
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch((error) => {
        console.error("Logout API error:", error);
      });
    }
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
