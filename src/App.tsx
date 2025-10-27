import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Cart from "@/components/Cart";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Shoes from "./pages/Shoes";
import NewArrivals from "./pages/NewArrivals";
import Sale from "./pages/Sale";
import NotFound from "./pages/NotFound";
import AdminLayout from "@/components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDeliveryLocations from "./pages/admin/AdminDeliveryLocations";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import MyOrders from "./pages/MyOrders";
import ResponsiveTest from "./pages/ResponsiveTest";
import Contact from "./pages/Contact";
import FAQs from "./pages/FAQs";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRedirect from "./components/AdminRedirect";
import GlobalWhatsAppButton from "./components/GlobalWhatsAppButton";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route
                  path="/"
                  element={
                    <AdminRedirect>
                      <Index />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/shoes"
                  element={
                    <AdminRedirect>
                      <Shoes />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/new-arrivals"
                  element={
                    <AdminRedirect>
                      <NewArrivals />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/sale"
                  element={
                    <AdminRedirect>
                      <Sale />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <AdminRedirect>
                      <Contact />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/faqs"
                  element={
                    <AdminRedirect>
                      <FAQs />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/shipping"
                  element={
                    <AdminRedirect>
                      <Shipping />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/returns"
                  element={
                    <AdminRedirect>
                      <Returns />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <AdminRedirect>
                      <About />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/careers"
                  element={
                    <AdminRedirect>
                      <Careers />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <AdminRedirect>
                      <Terms />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <AdminRedirect>
                      <Privacy />
                    </AdminRedirect>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <AdminRedirect>
                      <SignUp />
                    </AdminRedirect>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/responsive-test"
                  element={
                    <AdminRedirect>
                      <ResponsiveTest />
                    </AdminRedirect>
                  }
                />
                {/* Protected User Routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <AdminRedirect>
                        <ProfilePage />
                      </AdminRedirect>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-orders"
                  element={
                    <ProtectedRoute>
                      <AdminRedirect>
                        <ErrorBoundary>
                          <MyOrders />
                        </ErrorBoundary>
                      </AdminRedirect>
                    </ProtectedRoute>
                  }
                />
                {/* Admin Routes - Protected */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    index
                    element={<Navigate to="/admin/dashboard" replace />}
                  />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route
                    path="delivery-locations"
                    element={<AdminDeliveryLocations />}
                  />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="users" element={<AdminUsers />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              {/* Global WhatsApp button component will handle admin hiding */}
              <GlobalWhatsAppButton />

              <Cart />
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
