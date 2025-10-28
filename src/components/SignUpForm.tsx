import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
  onClose: () => void;
  // Optional initial values to prefill the form (e.g. from query params)
  initialValues?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export default function SignUpForm({
  onSwitchToSignIn,
  onClose,
  initialValues,
}: SignUpFormProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: initialValues?.firstName || "",
    lastName: initialValues?.lastName || "",
    identifier: initialValues?.email || "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    subscribeNewsletter: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

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
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Determine if identifier is phone or email and call register accordingly
      const emailRegex = /\S+@\S+\.\S+/;
      const phoneRegex = /^\+?\d{7,15}$/;

      const payload: any = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        password: formData.password,
      };

      if (phoneRegex.test(formData.identifier)) {
        payload.phone = formData.identifier.trim();
      } else if (emailRegex.test(formData.identifier)) {
        payload.email = formData.identifier.trim();
      }

      const result = await register(payload);

      if (result.success) {
        onClose();
      } else {
        setErrors({
          general:
            result.error || "Failed to create account. Please try again.",
        });
      }
    } catch (error) {
      console.error("Sign up failed:", error);
      setErrors({ general: "Failed to create account. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleGoogleSignUp = () => {
    console.log("Google sign up clicked");
    // Implement Google OAuth here
  };

  const handleSocialSignUp = async (provider: "google" | "facebook") => {
    // Placeholder for social sign-in flows. If you later wire Supabase socials,
    // implement the provider flow here (redirect or popup).
    console.log(`Social sign up: ${provider}`);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Join SoleSnaps and discover amazing products
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error */}
        {errors.general && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {errors.general}
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={`pl-10 ${
                  errors.firstName ? "border-destructive" : ""
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={`pl-10 ${
                  errors.lastName ? "border-destructive" : ""
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email or Phone Field */}
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
              placeholder="Create a password"
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
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters with uppercase, lowercase, and number
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              className={`pl-10 pr-10 ${
                errors.confirmPassword ? "border-destructive" : ""
              }`}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) =>
                handleInputChange("agreeToTerms", !!checked)
              }
              disabled={isLoading}
              className={errors.agreeToTerms ? "border-destructive" : ""}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="agreeToTerms"
                className="text-xs font-normal leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <Button variant="link" className="h-auto p-0 text-xs underline">
                  Terms of Service
                </Button>{" "}
                and{" "}
                <Button variant="link" className="h-auto p-0 text-xs underline">
                  Privacy Policy
                </Button>
              </Label>
            </div>
          </div>
          {errors.agreeToTerms && (
            <p className="text-xs text-destructive">{errors.agreeToTerms}</p>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox
              id="subscribeNewsletter"
              checked={formData.subscribeNewsletter}
              onCheckedChange={(checked) =>
                handleInputChange("subscribeNewsletter", !!checked)
              }
              disabled={isLoading}
            />
            <Label
              htmlFor="subscribeNewsletter"
              className="text-xs font-normal leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Subscribe to our newsletter for exclusive deals and updates
            </Label>
          </div>
        </div>

        {/* Sign Up Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
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

      {/* Google Sign Up (use same markup as top) */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => handleSocialSignUp("google")}
          className="w-full inline-flex items-center justify-center gap-2 border rounded-md px-4 py-2 bg-white hover:bg-gray-50"
          disabled={isLoading}
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M21.35 11.1H12v2.8h5.35c-.23 1.34-1.05 2.48-2.24 3.24v2.7h3.62c2.12-1.96 3.34-4.84 3.34-8.74 0-.62-.06-1.22-.17-1.8z"
              fill="#4285F4"
            />
            <path
              d="M12 22c2.43 0 4.47-.8 5.96-2.16l-3.62-2.7c-.99.67-2.24 1.07-3.94 1.07-3.02 0-5.58-2.04-6.5-4.78H1.79v2.99C3.27 19.9 7.33 22 12 22z"
              fill="#34A853"
            />
            <path
              d="M5.5 13.43A7.02 7.02 0 015 12c0-.66.11-1.3.31-1.9V7.1H1.79A10 10 0 001.1 12c0 1.6.37 3.12 1.02 4.47l2.38-3.04z"
              fill="#FBBC05"
            />
            <path
              d="M12 6.5c1.32 0 2.5.45 3.43 1.34l2.58-2.58C16.45 3.1 14.42 2 12 2 7.33 2 3.27 4.1 1.79 7.1l3.52 2.99C6.42 8.54 8.98 6.5 12 6.5z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Switch to Sign In */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-primary hover:underline"
          onClick={onSwitchToSignIn}
          disabled={isLoading}
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}
