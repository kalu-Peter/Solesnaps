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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Calendar,
  Download,
  Loader2,
} from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
  userGrowth: number;
  averageOrderValue: number;
}

interface SalesData {
  period: string;
  revenue: number;
  orders: number;
  users: number;
}

interface TopProduct {
  id: number;
  name: string;
  sales: number;
  revenue: number;
  category: string;
}

interface OrdersByStatus {
  status: string;
  count: number;
  percentage: number;
}

const AdminAnalytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    userGrowth: 0,
    averageOrderValue: 0,
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch orders data
      const ordersResponse = await fetch('/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch users data
      const usersResponse = await fetch('/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch products data
      const productsResponse = await fetch('/admin/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (ordersResponse.ok && usersResponse.ok && productsResponse.ok) {
        const ordersData = await ordersResponse.json();
        const usersData = await usersResponse.json();
        const productsData = await productsResponse.json();

        const orders = ordersData.data.orders || [];
        const users = usersData.data.users || [];
        const products = productsData.data.products || [];

        // Calculate analytics
        const totalRevenue = orders.reduce((sum: number, order: any) => {
          return sum + parseFloat(order.total_amount || 0);
        }, 0);

        const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

        // Mock growth data (you can enhance this with historical data)
        const revenueGrowth = Math.floor(Math.random() * 30) + 5;
        const orderGrowth = Math.floor(Math.random() * 25) + 2;
        const userGrowth = Math.floor(Math.random() * 20) + 3;

        setAnalyticsData({
          totalRevenue,
          totalOrders: orders.length,
          totalUsers: users.length,
          totalProducts: products.length,
          revenueGrowth,
          orderGrowth,
          userGrowth,
          averageOrderValue,
        });

        // Generate sales data (mock time series data)
        const mockSalesData: SalesData[] = [];
        const daysBack = parseInt(timeRange);
        for (let i = daysBack; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          mockSalesData.push({
            period: date.toLocaleDateString(),
            revenue: Math.floor(Math.random() * 5000) + 1000,
            orders: Math.floor(Math.random() * 50) + 10,
            users: Math.floor(Math.random() * 20) + 5,
          });
        }
        setSalesData(mockSalesData);

        // Generate top products data
        const mockTopProducts: TopProduct[] = products.slice(0, 5).map((product: any) => ({
          id: product.id,
          name: product.name,
          sales: Math.floor(Math.random() * 200) + 50,
          revenue: Math.floor(Math.random() * 10000) + 2000,
          category: 'Shoes',
        }));
        setTopProducts(mockTopProducts);

        // Calculate orders by status
        const statusCounts: { [key: string]: number } = {};
        orders.forEach((order: any) => {
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });

        const ordersByStatusData: OrdersByStatus[] = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count: count as number,
          percentage: orders.length > 0 ? Math.round(((count as number) / orders.length) * 100) : 0,
        }));
        setOrdersByStatus(ordersByStatusData);
      }

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [token, timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading analytics</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => fetchAnalyticsData()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Track your store's performance and growth metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +{analyticsData.revenueGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +{analyticsData.orderGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalUsers}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +{analyticsData.userGrowth}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Based on {analyticsData.totalOrders} orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Distribution of order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.count} orders
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.category}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{product.sales}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>Revenue and orders over the selected time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Sales trend visualization</p>
              <p className="text-sm">Chart visualization would be implemented here with a library like Chart.js or Recharts</p>
            </div>
            
            {/* Simple data table as placeholder */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">New Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.slice(-7).map((data, index) => (
                  <TableRow key={index}>
                    <TableCell>{data.period}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.revenue)}</TableCell>
                    <TableCell className="text-right">{data.orders}</TableCell>
                    <TableCell className="text-right">{data.users}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;