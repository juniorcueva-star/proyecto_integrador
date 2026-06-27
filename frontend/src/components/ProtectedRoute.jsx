import { Navigate } from "react-router-dom";
import { getAuthSession } from "../utils/authStorage";

function ProtectedRoute({ children, role }) {
  const session = getAuthSession();

  if (!session.token) {
    return <Navigate to="/login" replace />;
  }

  if (role && session.rol !== role) {
    return <Navigate to={session.rol === "ROLE_ADMIN" ? "/admin" : "/user"} replace />;
  }

  return children;
}

export default ProtectedRoute;
