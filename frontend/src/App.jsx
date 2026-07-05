import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
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
import { getAuthSession } from "./utils/authStorage";
import "./App.css";

function shouldShowAuthenticatedBackButton(pathname) {
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return false;
  }

  if (pathname === "/user" || pathname === "/admin") {
    return false;
  }

  return true;
}

function AuthenticatedBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAuthSession();
  const fallbackPath = session.rol === "ROLE_ADMIN" ? "/admin" : "/user";

  function handleGoBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath);
  }

  if (!session.token || !shouldShowAuthenticatedBackButton(location.pathname)) {
    return null;
  }

  return (
    <div className="page-back-row">
      <button type="button" className="button-secondary page-back-button" onClick={handleGoBack}>
        Volver
      </button>
    </div>
  );
}

function AppLayout({
  children,
  showHeader = true,
  headerMode = "default",
  showSessionActions = true,
}) {
  const session = getAuthSession();
  const shouldRenderHeader = showHeader && !session.token;

  return (
    <div className="app-shell">
      {shouldRenderHeader ? <SiteHeader mode={headerMode} showSessionActions={showSessionActions} /> : null}
      <main>
        <AuthenticatedBackButton />
        {children}
      </main>
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
            <AppLayout showHeader={false}>
              <ProductDetailPage />
            </AppLayout>
          }
        />
        <Route
          path="/vendedor/:id"
          element={
            <AppLayout headerMode="compact" showSessionActions={false}>
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
