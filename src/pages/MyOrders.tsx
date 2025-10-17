import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
  Calendar,
  MapPin,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price: string;
  size?: string;
  color?: string;
}

interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: string;
  created_at: string;
  updated_at: string;
  shipping_address: string;
  payment_method: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
}

const MyOrders = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Mock orders data (replace with actual API call)
  const mockOrders: Order[] = [
    {
      id: 1,
      order_number: "ORD-2025-001",
      status: "delivered",
      total_amount: "11500.00",
      created_at: "2025-01-10T10:30:00Z",
      updated_at: "2025-01-15T14:20:00Z",
      shipping_address: "123 Main St, Nairobi, Kenya",
      payment_method: "M-Pesa",
      tracking_number: "TRK123456789",
      estimated_delivery: "2025-01-15",
      items: [
        {
          id: 1,
          product_id: 101,
          product_name: "Sport Runner Pro",
          product_image: "/assets/brown.jpg",
          quantity: 1,
          price: "11500.00",
          size: "10",
          color: "Black"
        }
      ]
    },
    {
      id: 2,
      order_number: "ORD-2025-002",
      status: "shipped",
      total_amount: "23700.00",
      created_at: "2025-01-12T15:45:00Z",
      updated_at: "2025-01-16T09:30:00Z",
      shipping_address: "456 Oak Ave, Mombasa, Kenya",
      payment_method: "Credit Card",
      tracking_number: "TRK987654321",
      estimated_delivery: "2025-01-18",
      items: [
        {
          id: 2,
          product_id: 102,
          product_name: "Urban Classic",
          product_image: "/assets/womens.jpg",
          quantity: 2,
          price: "10200.00",
          size: "9",
          color: "Brown"
        },
        {
          id: 3,
          product_id: 103,
          product_name: "Trail Explorer",
          product_image: "/assets/female.jpg",
          quantity: 1,
          price: "3300.00",
          size: "8",
          color: "Green"
        }
      ]
    },
    {
      id: 3,
      order_number: "ORD-2025-003",
      status: "processing",
      total_amount: "16600.00",
      created_at: "2025-01-14T11:20:00Z",
      updated_at: "2025-01-16T16:45:00Z",
      shipping_address: "789 Pine Rd, Kisumu, Kenya",
      payment_method: "M-Pesa",
      estimated_delivery: "2025-01-20",
      items: [
        {
          id: 4,
          product_id: 104,
          product_name: "Performance Runner",
          product_image: "/assets/women2.jpg",
          quantity: 1,
          price: "16600.00",
          size: "11",
          color: "Blue"
        }
      ]
    }
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
  }, [isAuthenticated, navigate]);

  // Fetch orders (mock for now)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await orderService.getUserOrders(user?.id);
        // setOrders(response.data.orders);
        
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setOrders(mockOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => filterStatus === "all" || order.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "amount-high":
          return parseFloat(b.total_amount) - parseFloat(a.total_amount);
        case "amount-low":
          return parseFloat(a.total_amount) - parseFloat(b.total_amount);
        default:
          return 0;
      }
    });

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page Header */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              My Orders
            </h1>
          </div>
          <p className="text-muted-foreground">
            Track and manage your orders. View order details, delivery status, and order history.
          </p>
        </div>
      </section>

      {/* Filters and Controls */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[140px]">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[140px]">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="amount-high">Amount: High to Low</SelectItem>
                    <SelectItem value="amount-low">Amount: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        </div>
      </section>

      {/* Orders List */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-20 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Orders Found
                </h3>
                <p className="text-muted-foreground text-center mb-6">
                  {filterStatus === "all" 
                    ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                    : `No ${filterStatus} orders found. Try changing the filter.`}
                </p>
                <Button onClick={() => navigate("/shoes")}>
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.order_number}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {order.payment_method}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={`${getStatusColor(order.status)} capitalize`}
                          variant="outline"
                        >
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </Badge>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            KES {parseFloat(order.total_amount).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    {/* Order Items */}
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-16 w-16 rounded-lg object-cover bg-muted"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product_name}</h4>
                            <div className="text-sm text-muted-foreground">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && " • "}
                              {item.color && `Color: ${item.color}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              KES {parseFloat(item.price).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4" />
                          Shipping Address
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {order.shipping_address}
                        </p>
                      </div>
                      
                      {order.tracking_number && (
                        <div>
                          <h5 className="font-medium flex items-center gap-2 mb-2">
                            <Truck className="h-4 w-4" />
                            Tracking Information
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            Tracking: {order.tracking_number}
                          </p>
                          {order.estimated_delivery && (
                            <p className="text-sm text-muted-foreground">
                              Est. Delivery: {new Date(order.estimated_delivery).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {order.tracking_number && (
                        <Button variant="outline" size="sm">
                          <Truck className="h-4 w-4 mr-2" />
                          Track Package
                        </Button>
                      )}
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reorder
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MyOrders;