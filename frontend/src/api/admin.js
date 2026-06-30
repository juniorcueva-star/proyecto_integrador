import { apiRequest } from "./client";

export function fetchAdminStats() {
  return apiRequest("/admin/estadisticas");
}

export function fetchAdminClaims() {
  return apiRequest("/admin/reclamos");
}

export function fetchAdminUsers(searchText = "") {
  const params = new URLSearchParams();
  if (searchText) params.set("texto", searchText);

  return apiRequest(
    params.toString() ? `/admin/usuarios/buscar?${params}` : "/admin/usuarios",
  );
}

export function banAdminUser(id) {
  return apiRequest(`/admin/usuarios/${id}/banear`, {
    method: "PATCH",
  });
}

export function reactivateAdminUser(id) {
  return apiRequest(`/admin/usuarios/${id}/reactivar`, {
    method: "PATCH",
  });
}

export function deleteAdminUser(id) {
  return apiRequest(`/admin/usuarios/${id}`, {
    method: "DELETE",
  });
}

export function updateAdminClaim(id, payload) {
  return apiRequest(`/admin/reclamos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
