import { apiRequest } from "./client";

export function fetchCatalog() {
  return apiRequest("/prendas/catalogo");
}

export function fetchProductDetail(id) {
  return apiRequest(`/prendas/catalogo/${id}`);
}

export function fetchOwnProducts() {
  return apiRequest("/prendas/mis-prendas");
}

export function createProduct(payload) {
  return apiRequest("/prendas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
