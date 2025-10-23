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
  LogIn,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { orderService, Order, OrderItem } from "../services/orderService";

const MyOrders = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Fetch orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Debug authentication state
        console.log("Auth state:", {
          userId: user.id,
          isAuthenticated,
          token: localStorage.getItem("auth_token") ? "present" : "missing",
          userObject: user, // Add full user object to debug
        });

        // Convert sortBy to API parameters
        let sortParams = {};
        switch (sortBy) {
          case "newest":
            sortParams = { sort_by: "created_at", sort_order: "desc" as const };
            break;
          case "oldest":
            sortParams = { sort_by: "created_at", sort_order: "asc" as const };
            break;
          case "amount-high":
            sortParams = {
              sort_by: "total_amount",
              sort_order: "desc" as const,
            };
            break;
          case "amount-low":
            sortParams = {
              sort_by: "total_amount",
              sort_order: "asc" as const,
            };
            break;
          default:
            sortParams = { sort_by: "created_at", sort_order: "desc" as const };
        }

        const response = await orderService.getUserOrders(user.id, {
          status: filterStatus !== "all" ? filterStatus : undefined,
          limit: 50, // Fetch up to 50 orders
          ...sortParams,
        });

        console.log("Orders response:", response);

        // The orders are already properly formatted by the orderService
        const ordersData = response?.data?.orders || [];
        setOrders(ordersData);
      } catch (err) {
        console.error("Failed to fetch orders:", err);

        // Handle different types of errors
        if (err instanceof Error) {
          if (err.message.includes("Unauthorized")) {
            setError("Your session has expired. Please login again.");
          } else if (err.message.includes("Forbidden")) {
            setError(
              "You don't have permission to access these orders. Please contact support if this seems incorrect."
            );
          } else {
            setError(err.message);
          }
        } else {
          setError("Failed to load orders");
        }
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchOrders();
    }
  }, [isAuthenticated, user, filterStatus, sortBy]); // Add filterStatus and sortBy as dependencies

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
  }, [isAuthenticated, navigate]);

  // Filter and sort orders
  const filteredOrders = (orders || [])
    .filter((order) => filterStatus === "all" || order.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
          );
        case "amount-high":
          return (
            parseFloat(b.total_amount || "0") -
            parseFloat(a.total_amount || "0")
          );
        case "amount-low":
          return (
            parseFloat(a.total_amount || "0") -
            parseFloat(b.total_amount || "0")
          );
        default:
          return 0;
      }
    });

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "processing":
        return <RefreshCw className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <Package className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "shipped":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  // Early loading state while orders are being fetched
  if (loading && !orders) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                My Orders
              </h1>
            </div>
            <p className="text-muted-foreground">Loading your orders...</p>
          </div>
        </section>
      </div>
    );
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
            Track and manage your orders. View order details, delivery status,
            and order history.
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
                    <SelectItem value="amount-high">
                      Amount: High to Low
                    </SelectItem>
                    <SelectItem value="amount-low">
                      Amount: Low to High
                    </SelectItem>
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
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Failed to Load Orders
                </h3>
                <p className="text-muted-foreground text-center mb-6">
                  {error}
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  {(error?.includes("session has expired") ||
                    error?.includes("Unauthorized") ||
                    error?.includes("permission")) && (
                    <Button
                      variant="outline"
                      onClick={() => navigate("/login")}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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
                            {order.payment_method ||
                              "Payment method not available"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={`${getStatusColor(
                            order.status
                          )} capitalize`}
                          variant="outline"
                        >
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </Badge>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            KES{" "}
                            {parseFloat(
                              order.total_amount || "0"
                            ).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(order.items || []).length} item
                            {(order.items || []).length > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* Order Items */}
                    <div className="space-y-4">
                      {(order.items || []).map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <img
                            src={
                              item.product_image || "/placeholder-product.jpg"
                            }
                            alt={item.product_name}
                            className="h-16 w-16 rounded-lg object-cover bg-muted"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder-product.jpg";
                            }}
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
                              KES{" "}
                              {parseFloat(item.price || "0").toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Qty: {item.quantity || 0}
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
                          {typeof order.shipping_address === "object" &&
                          order.shipping_address
                            ? (() => {
                                const addr = order.shipping_address as any;
                                return (
                                  `${addr.city || ""}, ${
                                    addr.pickup_location || ""
                                  }`.replace(/^,\s*|,\s*$/g, "") ||
                                  "Address not available"
                                );
                              })()
                            : order.shipping_address || "Address not available"}
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
                              Est. Delivery:{" "}
                              {new Date(
                                order.estimated_delivery
                              ).toLocaleDateString()}
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
                      {order.status === "delivered" && (
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
