import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabaseDb } from "@/lib/supabase";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface UserFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  date_of_birth: string;
  gender: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [authError, setAuthError] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "admin",
    phone: "",
    date_of_birth: "",
    gender: "",
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const checkAuthAndFetch = async () => {
    // Check both possible token keys for compatibility
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token");

    if (!token) {
      setAuthError(true);
      setLoading(false);
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin panel.",
        variant: "destructive",
      });
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }

    // If we have a token, proceed with fetching
    await fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setAuthError(false);

      // Check both possible token keys for compatibility
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("auth_token");

      if (!token) {
        throw new Error("No access token found");
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("is_verified", statusFilter);

      const { data: usersData, error } = await supabaseDb.getUsers({
        search: searchTerm || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        is_verified:
          statusFilter !== "all" ? statusFilter === "verified" : undefined,
        page: currentPage,
        limit: 20,
      });

      if (error) {
        console.error("Failed to fetch users:", error.message);
        throw new Error(error.message || "Failed to fetch users");
      }

      setUsers(usersData || []);
      setTotalPages(1); // Simple pagination for now
    } catch (error: any) {
      console.error("Error fetching users:", error);
      if (!authError) {
        toast({
          title: "Error",
          description:
            error.message || "Failed to fetch users. Please try again.",
          variant: "destructive",
        });
      }
      // Set empty array on error to prevent crashes
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Initial load effect
  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  // Effect for pagination and filters - only if authenticated
  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token");
    if (!token) {
      setAuthError(true);
      setLoading(false);
      return;
    }

    if (!authError) {
      fetchUsers();
    }
  }, [currentPage, roleFilter, statusFilter]);

  // Separate useEffect for search with debouncing
  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token");
    if (!token || authError) {
      return; // Don't search if there's no token or auth error
    }

    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchUsers();
      } else {
        setCurrentPage(1); // Reset to first page when searching
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authError) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create users.",
        variant: "destructive",
      });
      return;
    }

    // Client-side validation
    if (formData.first_name.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "First name must be at least 2 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (formData.last_name.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "Last name must be at least 2 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      toast({
        title: "Validation Error",
        description:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("auth_token");

      if (!token) {
        setAuthError(true);
        toast({
          title: "Authentication Required",
          description: "Please log in to continue.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      // Clean up the data before sending
      const adminUserData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: "admin",
        ...(formData.phone.trim() && { phone: formData.phone.trim() }),
        ...(formData.date_of_birth && {
          date_of_birth: formData.date_of_birth,
        }),
        ...(formData.gender && { gender: formData.gender }),
      };

      const { data: newUser, error } = await supabaseDb.createUser(
        adminUserData
      );

      if (error) {
        console.error("Failed to create admin user:", error.message);
        throw new Error(error.message || "Failed to create admin user");
      }

      console.log("Admin user created:", newUser);

      toast({
        title: "Success",
        description: "Admin user created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      checkAuthAndFetch();
    } catch (error: any) {
      console.error("Error creating admin user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("auth_token");
      const updateData = { ...formData };

      // Don't send empty password
      if (!updateData.password) {
        delete updateData.password;
      }

      // Don't send empty phone (will fail mobile phone validation)
      if (!updateData.phone || updateData.phone.trim() === "") {
        delete updateData.phone;
      }

      // Don't send empty date_of_birth
      if (!updateData.date_of_birth) {
        delete updateData.date_of_birth;
      }

      // Don't send empty gender
      if (!updateData.gender) {
        delete updateData.gender;
      }

      const { data: updatedUser, error } = await supabaseDb.updateUser(
        selectedUser.id.toString(),
        updateData
      );

      if (error) {
        console.error("Failed to update user:", error.message);
        throw new Error(error.message || "Failed to update user");
      }

      console.log("User updated:", updatedUser);

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      checkAuthAndFetch();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const { data: updatedUser, error } = await supabaseDb.updateUser(
        user.id.toString(),
        { is_verified: !user.is_verified }
      );

      if (error) {
        console.error("Failed to update user status:", error.message);
        throw new Error(error.message || "Failed to update user status");
      }

      console.log("User status updated:", updatedUser);

      toast({
        title: "Success",
        description: `User ${
          !user.is_verified ? "activated" : "deactivated"
        } successfully`,
      });

      checkAuthAndFetch();
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabaseDb.deleteUser(userToDelete.id.toString());

      if (error) {
        console.error("Failed to delete user:", error.message);
        throw new Error(error.message || "Failed to delete user");
      }

      console.log("User deleted successfully");

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      checkAuthAndFetch();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role: "admin",
      phone: "",
      date_of_birth: "",
      gender: "",
    });
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: "", // Don't pre-fill password
      role: user.role,
      phone: user.phone || "",
      date_of_birth: user.date_of_birth || "",
      gender: user.gender || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={authError}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Admin User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-black">
                    All Roles
                  </SelectItem>
                  <SelectItem value="customer" className="text-black">
                    Customer
                  </SelectItem>
                  <SelectItem value="admin" className="text-black">
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-black">
                    All Status
                  </SelectItem>
                  <SelectItem value="true" className="text-black">
                    Active
                  </SelectItem>
                  <SelectItem value="false" className="text-black">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage system users and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authError ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Authentication Required
              </h3>
              <p className="text-muted-foreground mb-4">
                You need to be logged in to access user management.
              </p>
              <Button onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          ) : loading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Name</TableHead>
                    <TableHead className="min-w-[200px]">Email</TableHead>
                    <TableHead className="min-w-[80px]">Role</TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">
                      Phone
                    </TableHead>
                    <TableHead className="min-w-[80px] hidden md:table-cell">
                      Gender
                    </TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[100px] hidden lg:table-cell">
                      Created
                    </TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            {user.phone || "No phone"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{user.email}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {user.gender
                              ? user.gender.charAt(0).toUpperCase() +
                                user.gender.slice(1)
                              : "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {user.phone || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.gender ? (
                          <Badge variant="outline">
                            {user.gender.charAt(0).toUpperCase() +
                              user.gender.slice(1)}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_verified ? "default" : "destructive"}
                        >
                          {user.is_verified ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(user)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit user</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={
                                    user.is_verified ? "destructive" : "default"
                                  }
                                  size="sm"
                                  onClick={() => handleToggleUserStatus(user)}
                                  className="h-8 w-8 p-0"
                                >
                                  {user.is_verified ? (
                                    <UserX className="w-4 h-4" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {user.is_verified
                                    ? "Deactivate user"
                                    : "Activate user"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openDeleteDialog(user)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete user</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Admin User</DialogTitle>
            <DialogDescription>
              Add a new administrator to the system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="At least 8 characters with upper, lower & number"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must contain at least one uppercase letter, one lowercase
                letter, and one number
              </p>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
                disabled
              >
                <SelectTrigger className="text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className="text-black">
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="e.g., +1234567890 or 1234567890"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a valid mobile phone number (optional)
              </p>
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender (Optional)</Label>
              <Select
                value={formData.gender || "not_specified"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    gender: value === "not_specified" ? "" : value,
                  })
                }
              >
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_specified" className="text-black">
                    Not specified
                  </SelectItem>
                  <SelectItem value="male" className="text-black">
                    Male
                  </SelectItem>
                  <SelectItem value="female" className="text-black">
                    Female
                  </SelectItem>
                  <SelectItem value="other" className="text-black">
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Admin User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input
                  id="edit_first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input
                  id="edit_last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_email">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_password">
                Password (Leave blank to keep current)
              </Label>
              <Input
                id="edit_password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div>
              <Label htmlFor="edit_role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer" className="text-black">
                    Customer
                  </SelectItem>
                  <SelectItem value="admin" className="text-black">
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="e.g., +1234567890 or 1234567890"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a valid mobile phone number (leave empty to remove)
              </p>
            </div>
            <div>
              <Label htmlFor="edit_date_of_birth">Date of Birth</Label>
              <Input
                id="edit_date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_gender">Gender</Label>
              <Select
                value={formData.gender || "not_specified"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    gender: value === "not_specified" ? "" : value,
                  })
                }
              >
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_specified" className="text-black">
                    Not specified
                  </SelectItem>
                  <SelectItem value="male" className="text-black">
                    Male
                  </SelectItem>
                  <SelectItem value="female" className="text-black">
                    Female
                  </SelectItem>
                  <SelectItem value="other" className="text-black">
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for{" "}
              <strong>
                {userToDelete?.first_name} {userToDelete?.last_name}
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
