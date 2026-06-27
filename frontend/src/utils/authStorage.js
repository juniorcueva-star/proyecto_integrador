export function persistAuthSession(session) {
  localStorage.setItem("token", session.token);
  localStorage.setItem("rol", session.rol);
  localStorage.setItem("nombre", session.nombre);
  localStorage.setItem("usuarioId", String(session.usuarioId));
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
  localStorage.removeItem("nombre");
  localStorage.removeItem("usuarioId");
}

export function getAuthSession() {
  return {
    token: localStorage.getItem("token"),
    rol: localStorage.getItem("rol"),
    nombre: localStorage.getItem("nombre"),
    usuarioId: localStorage.getItem("usuarioId"),
  };
}
