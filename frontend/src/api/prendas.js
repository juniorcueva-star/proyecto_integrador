import { apiRequest } from "./client";

export function fetchCatalog(filters = {}) {
  const params = new URLSearchParams();

  if (filters.texto) params.set("texto", filters.texto);
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.precioMinimo) params.set("precioMinimo", filters.precioMinimo);
  if (filters.precioMaximo) params.set("precioMaximo", filters.precioMaximo);

  const query = params.toString();
  return apiRequest(query ? `/prendas/catalogo/buscar?${query}` : "/prendas/catalogo");
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

export function createProductWithImage(payload, imageFile) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append("imagen", imageFile);

  return apiRequest("/prendas/con-imagen", {
    method: "POST",
    body: formData,
  });
}

export function updateProduct(id, payload) {
  return apiRequest(`/prendas/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateProductImage(id, imageFile) {
  const formData = new FormData();
  formData.append("imagen", imageFile);

  return apiRequest(`/prendas/${id}/imagen`, {
    method: "PATCH",
    body: formData,
  });
}

export function deleteProduct(id) {
  return apiRequest(`/prendas/${id}`, {
    method: "DELETE",
  });
}

export function updateProductStatus(id, statusAction) {
  return apiRequest(`/prendas/${id}/${statusAction}`, {
    method: "PATCH",
  });
}
