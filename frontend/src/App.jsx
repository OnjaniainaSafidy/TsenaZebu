// frontend/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar     from "./components/layout/Navbar";
import Footer     from "./components/layout/Footer";
import Spinner    from "./components/ui/Spinner";

import Home             from "./pages/Home";
import Marketplace      from "./pages/Marketplace";
import ZebuDetail       from "./pages/ZebuDetail";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import Profile          from "./pages/Profile";
import SellerDashboard  from "./pages/SellerDashboard";
import Admin            from "./pages/Admin";
import NotFound         from "./pages/NotFound";

import MyOrders         from "./pages/MyOrders";

// ── Guards ────────────────────────────────────────────────────

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const SellerRoute = ({ children }) => {
  const { isSeller, loading } = useAuth();
  if (loading) return <Spinner />;
  return isSeller ? children : <Navigate to="/" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Spinner />;
  return isAdmin ? children : <Navigate to="/" replace />;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

// ── App ───────────────────────────────────────────────────────

export default function App() {
  const { loading } = useAuth();
  if (loading) return <Spinner fullscreen />;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <main className="flex-1 pt-16">
        <Routes>
          {/* Public */}
          <Route path="/"             element={<Home />} />
          <Route path="/marketplace"  element={<Marketplace />} />
          <Route path="/zebus/:id"    element={<ZebuDetail />} />

          {/* Guest only */}
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* Auth required */}
          <Route path="/profile"    element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/my-orders"  element={<PrivateRoute><MyOrders /></PrivateRoute>} />

          {/* Seller */}
          <Route path="/dashboard" element={<SellerRoute><SellerDashboard /></SellerRoute>} />

          {/* Admin */}
          <Route path="/admin"     element={<AdminRoute><Admin /></AdminRoute>} />

          {/* 404 */}
          <Route path="*"          element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
