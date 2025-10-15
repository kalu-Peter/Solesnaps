import React, { useState } from "react";
import { Link } from "react-router-dom";
import SignInForm from "@/components/SignInForm";
import SignUpForm from "@/components/SignUpForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleSwitchToSignUp = () => {
    setMode("signup");
  };

  const handleSwitchToSignIn = () => {
    setMode("signin");
  };

  const handleClose = () => {
    // For the page version, we don't close, just navigate back
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SoleSnaps
            </h1>
          </Link>
        </div>

        {/* Auth forms */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {mode === "signin" ? (
            <SignInForm
              onSwitchToSignUp={handleSwitchToSignUp}
              onClose={handleClose}
            />
          ) : (
            <SignUpForm
              onSwitchToSignIn={handleSwitchToSignIn}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Mode switch for mobile/better UX */}
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={
              mode === "signin" ? handleSwitchToSignUp : handleSwitchToSignIn
            }
            className="text-sm"
          >
            {mode === "signin"
              ? "Need an account? Sign up here"
              : "Already have an account? Sign in here"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
