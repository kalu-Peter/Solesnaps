import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import useAuthenticatedFetch from "@/hooks/useAuthenticatedFetch";
import { supabaseDb } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Filter,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  Order,
  OrderItem,
  fetchOrders,
  fetchOrderById,
  updateOrderStatus as updateOrderStatusAPI,
} from "@/lib/orders";

const AdminOrders = () => {
  const { token, isAuthenticated, user, isAdmin } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_orders: 0,
    per_page: 10,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Fetch orders from API
  useEffect(() => {
    const loadOrders = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const filters: any = { limit: 50 }; // Increase limit to see more orders
        if (selectedStatus !== "all") {
          filters.status = selectedStatus;
        }
        // For admin, we don't filter by userId - we want all orders

        const { data: orders, error } = await supabaseDb.getOrders(filters);

        if (error) {
          console.error("Failed to fetch orders:", error.message);
          throw new Error("Failed to fetch orders");
        }

        // Convert string numbers to actual numbers and ensure user data is available
        const processedOrders =
          orders?.map((order: any) => {
            return {
              ...order,
              total_amount: parseFloat(order.total_amount || 0),
              subtotal_amount: order.subtotal_amount
                ? parseFloat(order.subtotal_amount)
                : undefined,
              shipping_amount: order.shipping_amount
                ? parseFloat(order.shipping_amount)
                : undefined,
              // Ensure user information is properly formatted
              user_name: order.users
                ? `${order.users.first_name || ""} ${
                    order.users.last_name || ""
                  }`.trim() || "Unknown User"
                : `User ID: ${order.user_id || "Unknown"}`, // Show user ID as fallback
              user_email:
                order.users?.email || `user-${order.user_id}@unknown.com`,
              user_phone: order.users?.phone || "No phone",
              // Count items properly
              item_count: order.order_items?.length || 0,
              // Transform order items for display
              items:
                order.order_items?.map((item: any) => ({
                  id: item.id,
                  product_id: item.product_id,
                  product_name:
                    item.products?.name || "Product name not available",
                  product_image: item.products?.product_images?.[0]?.url || "",
                  quantity: item.quantity,
                  price: item.price || "0",
                  size: item.size,
                  color: item.color,
                })) || [],
            };
          }) || [];

        setOrders(processedOrders);
        setPagination({
          current_page: currentPage,
          total_pages: Math.ceil((orders?.length || 0) / 10),
          total_orders: orders?.length || 0,
          per_page: 10,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch orders");
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [token, currentPage, selectedStatus]);

  // Filter orders locally for search
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.user_name?.toLowerCase().includes(searchLower) ||
      order.user_email?.toLowerCase().includes(searchLower)
    );
  });

  const statusOptions = [
    "all",
    "pending",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "shipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "processing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "refunded":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleViewOrder = async (order: Order) => {
    if (!token) return;

    setLoadingOrderDetail(true);
    try {
      const { data: orderDetail, error } = await supabaseDb.getOrder(
        order.id.toString()
      );

      if (error) {
        console.error("Failed to fetch order details:", error.message);
        throw new Error("Failed to fetch order details");
      }

      console.log("Order details:", orderDetail);

      // Ensure the order detail has properly formatted user information
      const processedOrderDetail = {
        ...orderDetail,
        user_name: orderDetail.users
          ? `${orderDetail.users.first_name || ""} ${
              orderDetail.users.last_name || ""
            }`.trim() || "Unknown User"
          : "Unknown User",
        user_email: orderDetail.users?.email || "No email",
        user_phone: orderDetail.users?.phone || "No phone",
        items:
          orderDetail.order_items?.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.products?.name || "Product name not available",
            product_image: item.products?.product_images?.[0]?.url || "",
            quantity: item.quantity,
            price: item.price || "0",
            size: item.size,
            color: item.color,
          })) || [],
      };

      setSelectedOrder(processedOrderDetail);
      setIsOrderDetailOpen(true);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch order details"
      );
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    if (!token) return;

    setUpdatingStatus(orderId);
    try {
      const { error } = await supabaseDb.updateOrderStatus(
        orderId.toString(),
        newStatus
      );

      if (error) {
        console.error("Failed to update order status:", error.message);
        throw new Error("Failed to update order status");
      }

      // Refresh orders list
      const filters: any = { limit: 10 };
      if (selectedStatus !== "all") {
        filters.status = selectedStatus;
      }

      const { data: refreshedOrders, error: refreshError } =
        await supabaseDb.getOrders(filters);

      if (!refreshError && refreshedOrders) {
        const processedOrders = refreshedOrders.map((order: any) => ({
          ...order,
          total_amount: parseFloat(order.total_amount || 0),
          subtotal_amount: order.subtotal_amount
            ? parseFloat(order.subtotal_amount)
            : undefined,
          shipping_amount: order.shipping_amount
            ? parseFloat(order.shipping_amount)
            : undefined,
          // Ensure user information is properly formatted
          user_name: order.users
            ? `${order.users.first_name || ""} ${
                order.users.last_name || ""
              }`.trim() || "Unknown User"
            : "Unknown User",
          user_email: order.users?.email || "No email",
          user_phone: order.users?.phone || "No phone",
          // Count items properly
          item_count: order.order_items?.length || 0,
        }));

        setOrders(processedOrders);
        setPagination({
          current_page: currentPage,
          total_pages: Math.ceil(refreshedOrders.length / 10),
          total_orders: refreshedOrders.length,
          per_page: 10,
        });
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update order status"
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setCurrentPage(1); // Reset to first page when filtering
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          Please log in to access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading orders</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground">
          Manage customer orders and track fulfillment
        </p>
      </div>

      {/* Order Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </p>
                <p className="text-2xl font-bold">{pagination.total_orders}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter((o) => o.status === "pending").length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Processing
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {orders.filter((o) => o.status === "processing").length}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter((o) => o.status === "completed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>
            Search, filter, and manage customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedStatus}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-[150px] text-black">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.slice(1).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {orders.length === 0
                        ? "No orders found"
                        : "No orders match your search"}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number || `#${order.id}`}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {order.user_name || "Unknown User"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.user_email || "No email"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.item_count} item
                        {order.item_count !== 1 ? "s" : ""}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      Ksh{" "}
                      {parseFloat(
                        order.total_amount?.toString() || "0"
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <Badge
                          variant="secondary"
                          className={getStatusColor(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getPaymentStatusColor(
                          order.payment_status || "pending"
                        )}
                      >
                        {order.payment_status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={updatingStatus === order.id}
                          >
                            {updatingStatus === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewOrder(order)}
                            disabled={loadingOrderDetail}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "processing")
                            }
                            disabled={updatingStatus === order.id}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Mark Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "shipped")
                            }
                            disabled={updatingStatus === order.id}
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            Mark Shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateOrderStatus(order.id, "completed")
                            }
                            disabled={updatingStatus === order.id}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Completed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? `Order ${
                    selectedOrder.order_number || `#${selectedOrder.id}`
                  }`
                : "Order information"}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">
                      {selectedOrder.user_name || "Unknown User"}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedOrder.user_email || "No email"}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedOrder.user_phone || "No phone"}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <Badge
                        className={getPaymentStatusColor(
                          selectedOrder.payment_status || "pending"
                        )}
                      >
                        {selectedOrder.payment_status || "pending"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>
                        {new Date(
                          selectedOrder.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedOrder.tracking_number && (
                      <div className="flex justify-between">
                        <span>Tracking:</span>
                        <span className="font-mono">
                          {selectedOrder.tracking_number}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="capitalize">
                        {selectedOrder.payment_method || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                          {item.size && ` • Size: ${item.size}`}
                          {item.color && ` • Color: ${item.color}`}
                        </p>
                      </div>
                      <p className="font-medium">
                        Ksh{" "}
                        {(
                          parseFloat(item.price?.toString() || "0") *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  )) || <p className="text-muted-foreground">No items found</p>}

                  {selectedOrder.subtotal_amount && (
                    <div className="flex justify-between items-center pt-2 text-sm">
                      <span>Subtotal:</span>
                      <span>
                        Ksh{" "}
                        {parseFloat(
                          selectedOrder.subtotal_amount?.toString() || "0"
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {selectedOrder.shipping_amount && (
                    <div className="flex justify-between items-center text-sm">
                      <span>Shipping:</span>
                      <span>
                        Ksh{" "}
                        {parseFloat(
                          selectedOrder.shipping_amount?.toString() || "0"
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 font-medium border-t">
                    <span>Total:</span>
                    <span>
                      Ksh{" "}
                      {parseFloat(
                        selectedOrder.total_amount?.toString() || "0"
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
