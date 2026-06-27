import { apiRequest } from "./client";

export function loginRequest(payload) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerRequest(payload) {
  return apiRequest("/auth/registro", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
