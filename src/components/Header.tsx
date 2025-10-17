import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  Settings,
  Shield,
  Menu,
  X,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthModal from "./AuthModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function Header() {
  const { totalItems, openCart } = useCart();
  const { user, isAuthenticated, isAdmin, logout, getFullName } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || "";
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || "";
    return firstInitial + lastInitial || "U";
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
              SoleSnaps
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/shoes"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Shoes
            </Link>
            <Link
              to="/new-arrivals"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              New Arrivals
            </Link>
            <Link
              to="/sale"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Sale
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>

              {/* Authentication Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar_url} alt={getFullName()} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user ? getUserInitials(user.first_name, user.last_name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {getFullName()}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground capitalize">
                          Role: {user?.role}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-orders")}>
                      <Package className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" size="icon" onClick={handleLoginClick}>
                  <User className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Cart Button - Always Visible */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center bg-primary text-primary-foreground rounded-full animate-pulse">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col space-y-4 mt-6">
                  {/* Search */}
                  <Button variant="ghost" className="justify-start">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>

                  {/* Navigation Links */}
                  <Link
                    to="/shoes"
                    className="flex items-center py-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Shoes
                  </Link>
                  <Link
                    to="/new-arrivals"
                    className="flex items-center py-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                    onClick={closeMobileMenu}
                  >
                    New Arrivals
                  </Link>
                  <Link
                    to="/sale"
                    className="flex items-center py-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Sale
                  </Link>

                  {/* User Section */}
                  <div className="border-t pt-4 mt-4">
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 pb-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.avatar_url} alt={getFullName()} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {user ? getUserInitials(user.first_name, user.last_name) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{getFullName()}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            navigate("/profile");
                            closeMobileMenu();
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            navigate("/my-orders");
                            closeMobileMenu();
                          }}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          My Orders
                        </Button>
                        
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              navigate("/admin");
                              closeMobileMenu();
                            }}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive hover:text-destructive"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => {
                          handleLoginClick();
                          closeMobileMenu();
                        }}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        initialMode="signin"
      />
    </>
  );
}
