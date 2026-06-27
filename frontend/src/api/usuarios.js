import { apiRequest } from "./client";

export function fetchPublicProfile(id) {
  return apiRequest(`/usuarios/${id}/perfil-publico`);
}

export function fetchOwnProfile() {
  return apiRequest("/usuarios/mi-perfil");
}
