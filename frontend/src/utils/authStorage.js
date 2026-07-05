export function persistAuthSession(session) {
  localStorage.setItem("token", session.token || "");
  localStorage.setItem("rol", session.rol || "ROLE_USER");
  localStorage.setItem("nombre", session.nombre || "");
  localStorage.setItem("usuarioId", String(session.usuarioId || ""));
  localStorage.setItem("email", session.email || "");
  localStorage.setItem("authSource", session.authSource || "firebase");
  localStorage.setItem("telefono", session.telefono || "");
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
  localStorage.removeItem("nombre");
  localStorage.removeItem("usuarioId");
  localStorage.removeItem("email");
  localStorage.removeItem("authSource");
  localStorage.removeItem("telefono");
}

export function getAuthSession() {
  return {
    token: localStorage.getItem("token"),
    rol: localStorage.getItem("rol"),
    nombre: localStorage.getItem("nombre"),
    usuarioId: localStorage.getItem("usuarioId"),
    email: localStorage.getItem("email"),
    authSource: localStorage.getItem("authSource"),
    telefono: localStorage.getItem("telefono"),
  };
}
