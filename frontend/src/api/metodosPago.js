import { apiRequest } from "./client";

export function fetchOwnPaymentMethods() {
  return apiRequest("/metodos-pago/mis-metodos");
}

export function createPaymentMethod(payload) {
  return apiRequest("/metodos-pago", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function togglePaymentMethod(id, active) {
  return apiRequest(`/metodos-pago/${id}/${active ? "activar" : "desactivar"}`, {
    method: "PATCH",
  });
}

export function deletePaymentMethod(id) {
  return apiRequest(`/metodos-pago/${id}`, {
    method: "DELETE",
  });
}
