import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, Chrome } from "lucide-react";

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  onClose: () => void;
}

export default function SignInForm({
  onSwitchToSignUp,
  onClose,
}: SignInFormProps) {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.identifier) {
      newErrors.identifier = "Email or phone is required";
    } else {
      const emailRegex = /\S+@\S+\.\S+/;
      const phoneRegex = /^\+?\d{7,15}$/;
      if (
        !emailRegex.test(formData.identifier) &&
        !phoneRegex.test(formData.identifier)
      ) {
        newErrors.identifier =
          "Enter a valid email or phone (e.g. +15551234567)";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await login(formData.identifier, formData.password);
      if (result.success) {
        // Wait a moment for user context to update
        setTimeout(() => {
          // Check if the logged-in user is an admin
          const currentUser = JSON.parse(
            localStorage.getItem("auth_user") || "{}"
          );
          if (currentUser.role === "admin") {
            console.log("Admin login detected, redirecting to admin dashboard");
            navigate("/admin/dashboard");
          } else {
            console.log("Regular user login, closing modal");
            onClose();
          }
        }, 100);
      } else {
        setErrors({
          general:
            result.error || "Invalid email or password. Please try again.",
        });
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      setErrors({ general: "Invalid email or password. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Google sign in clicked");
    // Implement Google OAuth here
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue shopping
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error */}
        {errors.general && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {errors.general}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-sm font-medium">
            Email or phone
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="identifier"
              type="text"
              placeholder="Email or phone (e.g. +15551234567)"
              value={formData.identifier}
              onChange={(e) => handleInputChange("identifier", e.target.value)}
              className={`pl-10 ${
                errors.identifier ? "border-destructive" : ""
              }`}
              disabled={isLoading}
            />
          </div>
          {errors.identifier && (
            <p className="text-xs text-destructive">{errors.identifier}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`pl-10 pr-10 ${
                errors.password ? "border-destructive" : ""
              }`}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        {/* Forgot Password */}
        <div className="text-right">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-sm text-primary hover:underline"
            disabled={isLoading}
          >
            Forgot your password?
          </Button>
        </div>

        {/* Sign In Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <Chrome className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>

      {/* Demo Accounts */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Demo Accounts:</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <strong>Admin:</strong> admin@solesnaps.com / admin123
            <span className="block text-green-600 text-xs mt-1">
              → Will be redirected to Admin Dashboard
            </span>
          </p>
          <p>
            <strong>User:</strong> john.doe@example.com / password123
            <span className="block text-blue-600 text-xs mt-1">
              → Access to store only
            </span>
          </p>
        </div>
      </div>

      {/* Switch to Sign Up */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-primary hover:underline"
          onClick={onSwitchToSignUp}
          disabled={isLoading}
        >
          Sign up
        </Button>
      </div>
    </div>
  );
}
