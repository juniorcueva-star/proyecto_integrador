import { apiRequest } from "./client";

export function fetchAdminStats() {
  return apiRequest("/admin/estadisticas");
}

export function fetchAdminClaims() {
  return apiRequest("/admin/reclamos");
}
