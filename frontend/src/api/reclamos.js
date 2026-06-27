import { apiRequest } from "./client";

export function fetchOwnClaims() {
  return apiRequest("/reclamos/mis-reclamos");
}

export function createClaim(payload) {
  return apiRequest("/reclamos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
