import { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
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
  ShoppingBag,
} from "lucide-react";

const AdminLayout = () => {
  const location = useLocation();
  const { token } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orderCount, setOrderCount] = useState<number>(0);

  // Fetch order count for badge
  useEffect(() => {
    const fetchOrderCount = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('/api/orders?limit=1', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrderCount(data.data.pagination?.total_orders || 0);
        }
      } catch (error) {
        console.error('Failed to fetch order count:', error);
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-[hsl(var(--sidebar-border))]">
        <Link to="/" className="flex items-center gap-2">
          <ShoppingBag className="h-8 w-8 text-[hsl(var(--sidebar-primary))]" />
          <div>
            <h2 className="font-bold text-lg text-[hsl(var(--sidebar-foreground))]">
              SoleSnaps
            </h2>
            <p className="text-xs text-[hsl(var(--sidebar-foreground))]/70">
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"
                  : "text-[hsl(var(--sidebar-foreground))]/70 hover:text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{item.title}</span>
              {item.badge && (
                <Badge
                  variant={isActive ? "secondary" : "default"}
                  className="ml-auto text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground">SoleSnaps Admin</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-64 p-0 bg-[hsl(var(--sidebar-background))] border-r-[hsl(var(--sidebar-border))]"
              >
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
