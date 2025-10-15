import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Camera,
  Edit3,
} from "lucide-react";

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {}
  );
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        dateOfBirth: user.date_of_birth || "",
        gender: user.gender || "",
      });
    }
  }, [user]);

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  // Handle profile form input changes
  const handleProfileInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (profileErrors[field]) {
      setProfileErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle password form input changes
  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validate profile form
  const validateProfileForm = () => {
    const errors: Record<string, string> = {};

    if (!profileData.name.trim()) {
      errors.name = "Name is required";
    } else if (profileData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!profileData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (
      profileData.phone &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(profileData.phone.replace(/\s/g, ""))
    ) {
      errors.phone = "Please enter a valid phone number";
    }

    if (
      profileData.dateOfBirth &&
      new Date(profileData.dateOfBirth) > new Date()
    ) {
      errors.dateOfBirth = "Date of birth cannot be in the future";
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)
    ) {
      errors.newPassword =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword =
        "New password must be different from current password";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfileForm()) return;

    setIsUpdatingProfile(true);
    setSuccessMessage("");

    try {
      const result = await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        date_of_birth: profileData.dateOfBirth,
        gender: profileData.gender,
      });

      if (result?.success) {
        setSuccessMessage("Profile updated successfully!");
        setIsEditingProfile(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setProfileErrors({
          general: result?.error || "Failed to update profile",
        });
      }
    } catch (error) {
      setProfileErrors({ general: "An unexpected error occurred" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    setSuccessMessage("");

    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result?.success) {
        setSuccessMessage("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setPasswordErrors({
          general: result?.error || "Failed to change password",
        });
      }
    } catch (error) {
      setPasswordErrors({ general: "An unexpected error occurred" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">
            Loading...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we load your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="mt-1"
              >
                {user.role === "admin" ? (
                  <>
                    <Shield className="h-3 w-3 mr-1" />
                    Administrator
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3 mr-1" />
                    User
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="security">Security & Password</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Manage your personal information and preferences
                  </CardDescription>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isEditingProfile ? "Cancel" : "Edit Profile"}
                </Button>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {profileErrors.general && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {profileErrors.general}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 " />
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) =>
                            handleProfileInputChange("name", e.target.value)
                          }
                          className={`pl-10 text-black ${
                            profileErrors.name ? "border-destructive" : ""
                          }`}
                          disabled={!isEditingProfile}
                          placeholder="Enter your full name"
                        />
                      </div>
                      {profileErrors.name && (
                        <p className="text-xs text-destructive">
                          {profileErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          className="pl-10 bg-muted text-black"
                          disabled={true}
                          placeholder="Email cannot be changed"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Email address cannot be changed for security reasons
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) =>
                            handleProfileInputChange("phone", e.target.value)
                          }
                          className={`pl-10 text-black ${
                            profileErrors.phone ? "border-destructive" : ""
                          }`}
                          disabled={!isEditingProfile}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      {profileErrors.phone && (
                        <p className="text-xs text-destructive">
                          {profileErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(e) =>
                            handleProfileInputChange(
                              "dateOfBirth",
                              e.target.value
                            )
                          }
                          className={`pl-10 text-black ${
                            profileErrors.dateOfBirth
                              ? "border-destructive"
                              : ""
                          }`}
                          disabled={!isEditingProfile}
                        />
                      </div>
                      {profileErrors.dateOfBirth && (
                        <p className="text-xs text-destructive">
                          {profileErrors.dateOfBirth}
                        </p>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={profileData.gender}
                        onChange={(e) =>
                          handleProfileInputChange("gender", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-md bg-background text-black ${
                          profileErrors.gender
                            ? "border-destructive"
                            : "border-input"
                        } ${
                          !isEditingProfile
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={!isEditingProfile}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {profileErrors.gender && (
                        <p className="text-xs text-destructive">
                          {profileErrors.gender}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setIsEditingProfile(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUpdatingProfile}>
                        <Save className="h-4 w-4 mr-2" />
                        {isUpdatingProfile ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security & Password</CardTitle>
                <CardDescription>
                  Change your password and manage security settings
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  {passwordErrors.general && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {passwordErrors.general}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          handlePasswordInputChange(
                            "currentPassword",
                            e.target.value
                          )
                        }
                        className={`pr-10 text-black ${
                          passwordErrors.currentPassword
                            ? "border-destructive"
                            : ""
                        }`}
                        placeholder="Enter your current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-xs text-destructive">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          handlePasswordInputChange(
                            "newPassword",
                            e.target.value
                          )
                        }
                        className={`pr-10 text-black ${
                          passwordErrors.newPassword ? "border-destructive" : ""
                        }`}
                        placeholder="Enter your new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-destructive">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase,
                      and number
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          handlePasswordInputChange(
                            "confirmPassword",
                            e.target.value
                          )
                        }
                        className={`pr-10 text-black ${
                          passwordErrors.confirmPassword
                            ? "border-destructive"
                            : ""
                        }`}
                        placeholder="Confirm your new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-destructive">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword
                        ? "Changing Password..."
                        : "Change Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
