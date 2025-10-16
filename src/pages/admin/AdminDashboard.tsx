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
} from "lucide-react";

const AdminDashboard = () => {
  // Mock data for dashboard
  const stats = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1% from last month",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Products",
      value: "234",
      change: "+12 new products",
      trend: "up",
      icon: Package,
    },
    {
      title: "Total Users",
      value: "1,429",
      change: "+18.2% from last month",
      trend: "up",
      icon: Users,
    },
    {
      title: "Orders",
      value: "89",
      change: "-2.1% from last month",
      trend: "down",
      icon: ShoppingCart,
    },
  ];

  const recentOrders = [
    {
      id: "#3001",
      customer: "Alice Johnson",
      email: "alice@example.com",
      status: "completed",
      amount: "$299.99",
      date: "2025-10-13",
    },
    {
      id: "#3002",
      customer: "Bob Smith",
      email: "bob@example.com",
      status: "processing",
      amount: "$159.99",
      date: "2025-10-13",
    },
    {
      id: "#3003",
      customer: "Carol Davis",
      email: "carol@example.com",
      status: "pending",
      amount: "$89.99",
      date: "2025-10-12",
    },
    {
      id: "#3004",
      customer: "David Wilson",
      email: "david@example.com",
      status: "completed",
      amount: "$199.99",
      date: "2025-10-12",
    },
    {
      id: "#3005",
      customer: "Eva Brown",
      email: "eva@example.com",
      status: "cancelled",
      amount: "$79.99",
      date: "2025-10-11",
    },
  ];

  const topProducts = [
    {
      name: "Sport Runner Pro",
      category: "Shoes",
      sales: 156,
      revenue: "$13,924.44",
    },
    {
      name: "Urban Classic",
      category: "Shoes",
      sales: 203,
      revenue: "$16,237.97",
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
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
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.email}
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
                      {order.amount}
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
                  key={product.name}
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
                      {product.revenue}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.sales} sales
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
            <Button className="h-20 flex-col gap-2">
              <Package className="h-5 w-5" />
              Add Product
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-5 w-5" />
              Manage Users
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <ShoppingCart className="h-5 w-5" />
              View Orders
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
