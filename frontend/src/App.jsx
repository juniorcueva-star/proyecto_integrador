import { BrowserRouter, Route, Routes } from "react-router-dom";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CatalogPage from "./pages/CatalogPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import RegisterPage from "./pages/RegisterPage";
import SellerProfilePage from "./pages/SellerProfilePage";
import UserDashboardPage from "./pages/UserDashboardPage";
import "./App.css";

function AppLayout({ children, showHeader = true, headerMode = "default" }) {
  return (
    <div className="app-shell">
      {showHeader ? <SiteHeader mode={headerMode} /> : null}
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout>
              <LandingPage />
            </AppLayout>
          }
        />
        <Route
          path="/login"
          element={
            <AppLayout headerMode="auth">
              <LoginPage />
            </AppLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AppLayout headerMode="auth">
              <RegisterPage />
            </AppLayout>
          }
        />
        <Route
          path="/catalogo"
          element={
            <AppLayout headerMode="compact">
              <CatalogPage />
            </AppLayout>
          }
        />
        <Route
          path="/prenda/:id"
          element={
            <AppLayout>
              <ProductDetailPage />
            </AppLayout>
          }
        />
        <Route
          path="/vendedor/:id"
          element={
            <AppLayout>
              <SellerProfilePage />
            </AppLayout>
          }
        />
        <Route
          path="/user"
          element={
            <AppLayout showHeader={false}>
              <ProtectedRoute role="ROLE_USER">
                <UserDashboardPage />
              </ProtectedRoute>
            </AppLayout>
          }
        />
        <Route
          path="/admin"
          element={
            <AppLayout showHeader={false}>
              <ProtectedRoute role="ROLE_ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
