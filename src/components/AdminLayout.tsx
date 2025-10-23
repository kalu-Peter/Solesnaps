import { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabaseDb } from "@/lib/supabase";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
  Menu,
  LogOut,
  BarChart3,
  Bell,
  MapPin,
  User,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminLayout = () => {
  const location = useLocation();
  const { token, user, logout, getFullName } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orderCount, setOrderCount] = useState<number>(0);

  // Fetch order count for badge
  useEffect(() => {
    const fetchOrderCount = async () => {
      if (!token) return;

      try {
        const { data: orders, error } = await supabaseDb.getOrders({
          limit: 1,
        });

        if (error) {
          console.error("Failed to fetch orders:", error.message);
        } else {
          console.log("Orders:", orders);
          setOrderCount(orders?.length || 0);
        }
      } catch (error) {
        console.error("Failed to fetch order count:", error);
      }
    };

    fetchOrderCount();
  }, [token]);

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Products",
      href: "/admin/products",
      icon: Package,
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
      badge: orderCount > 0 ? orderCount.toString() : undefined,
    },
    {
      title: "Delivery Locations",
      href: "/admin/delivery-locations",
      icon: MapPin,
    },
    {
      title: "Coupons",
      href: "/admin/coupons",
      icon: Tag,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || "";
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || "";
    return firstInitial + lastInitial || "A";
  };

  const handleLogout = () => {
    logout();
  };

  const MobileMenuContent = () => (
    <div className="flex flex-col h-full p-4 space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActiveRoute(item.href);

        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-foreground hover:text-primary hover:bg-primary/10 hover:shadow-sm"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
            title={`Go to ${item.title}`}
          >
            <Icon
              className={`h-5 w-5 transition-transform duration-200 ${
                isActive ? "" : "group-hover:scale-110"
              }`}
            />
            <span className="font-medium transition-colors duration-200">
              {item.title}
            </span>
            {item.badge && (
              <Badge
                variant={isActive ? "secondary" : "default"}
                className={`ml-auto text-xs transition-all duration-200 ${
                  isActive
                    ? ""
                    : "group-hover:bg-primary group-hover:text-primary-foreground"
                }`}
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SoleSnaps Admin</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:shadow-sm"
                  }`}
                  title={`Go to ${item.title}`}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isActive ? "" : "group-hover:scale-110"
                    }`}
                  />
                  <span className="transition-colors duration-200">
                    {item.title}
                  </span>
                  {item.badge && (
                    <Badge
                      variant={isActive ? "secondary" : "default"}
                      className={`text-xs transition-all duration-200 ${
                        isActive
                          ? ""
                          : "group-hover:bg-primary group-hover:text-primary-foreground"
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side - User menu and mobile button */}
          <div className="flex items-center gap-2">
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                  title={`${getFullName()} - Admin Profile`}
                >
                  <Avatar className="h-8 w-8 transition-transform duration-200 hover:scale-105">
                    <AvatarImage src={user?.avatar_url} alt={getFullName()} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user
                        ? getUserInitials(user.first_name, user.last_name)
                        : "A"}
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
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                  title="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <MobileMenuContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
