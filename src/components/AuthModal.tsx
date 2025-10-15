import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "signin",
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);

  const handleSwitchToSignUp = () => {
    setMode("signup");
  };

  const handleSwitchToSignIn = () => {
    setMode("signin");
  };

  const handleClose = () => {
    onClose();
    // Reset to initial mode when closing
    setTimeout(() => setMode(initialMode), 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{mode === "signin" ? "Sign In" : "Sign Up"}</DialogTitle>
          <DialogDescription>
            {mode === "signin"
              ? "Sign in to your SoleSnaps account"
              : "Create a new SoleSnaps account"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
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
      </DialogContent>
    </Dialog>
  );
}
