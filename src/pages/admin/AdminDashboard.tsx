import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Eye,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  user_name: string;
  user_email: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface TopProduct {
  id: number;
  name: string;
  category: string;
  total_sales: number;
  total_revenue: number;
}

const AdminDashboard = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    if (!token) return;

    try {
      // Fetch orders for total revenue and order count
      const ordersResponse = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch users count
      const usersResponse = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch products count
      const productsResponse = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const orders = ordersData.data.orders;
        
        // Calculate total revenue
        const totalRevenue = orders.reduce((sum: number, order: any) => {
          return sum + parseFloat(order.total_amount || 0);
        }, 0);

        setStats(prev => ({
          ...prev,
          totalRevenue,
          totalOrders: ordersData.data.pagination?.total_orders || orders.length,
        }));

        // Set recent orders (first 5)
        const formattedOrders: RecentOrder[] = orders.slice(0, 5).map((order: any) => ({
          id: order.id,
          order_number: order.order_number || `#${order.id}`,
          user_name: order.user_name || 'Unknown User',
          user_email: order.user_email || 'No email',
          status: order.status,
          total_amount: parseFloat(order.total_amount || 0),
          created_at: order.created_at,
        }));
        setRecentOrders(formattedOrders);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.data.pagination?.total_users || usersData.data.users?.length || 0,
        }));
      }

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setStats(prev => ({
          ...prev,
          totalProducts: productsData.data.pagination?.total_products || productsData.data.products?.length || 0,
        }));

        // Mock top products calculation (you can enhance this with actual sales data)
        const products = productsData.data.products || [];
        const mockTopProducts: TopProduct[] = products.slice(0, 2).map((product: any, index: number) => ({
          id: product.id,
          name: product.name,
          category: 'Shoes', // You can get this from categories if available
          total_sales: Math.floor(Math.random() * 200) + 50, // Mock sales data
          total_revenue: Math.floor(Math.random() * 20000) + 5000, // Mock revenue data
        }));
        setTopProducts(mockTopProducts);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      await fetchDashboardStats();
      setLoading(false);
    };

    loadDashboard();
  }, [token]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const statsCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: "Real-time data",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Products",
      value: stats.totalProducts.toString(),
      change: "Active products",
      trend: "up",
      icon: Package,
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toString(),
      change: "Registered users",
      trend: "up",
      icon: Users,
    },
    {
      title: "Orders",
      value: stats.totalOrders.toString(),
      change: "Total orders",
      trend: "up",
      icon: ShoppingCart,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading dashboard</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => {
              const Icon = stat.icon;
              const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendIcon
                        className={`mr-1 h-3 w-3 ${
                          stat.trend === "up" ? "text-green-500" : "text-red-500"
                        }`}
                      />
                      {stat.change}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from your customers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.user_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.user_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(order.status)}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(order.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View All Orders
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>
                  Best performing products this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {product.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          {formatCurrency(product.total_revenue)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {product.total_sales} sales
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View All Products
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to manage your store</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button className="h-20 flex-col gap-2 text-primary-foreground">
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-medium">Add Product</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 text-foreground hover:text-primary">
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-medium">Manage Users</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 text-foreground hover:text-primary">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm font-medium">View Orders</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 text-foreground hover:text-primary">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-medium">Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
