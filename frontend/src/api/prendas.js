import {
  createProductInFirebase,
  createProductWithImageInFirebase,
  deleteProductInFirebase,
  fetchCatalogFromFirebase,
  fetchOwnProductsFromFirebase,
  fetchProductDetailFromFirebase,
  fetchProductOptionsFromFirebase,
  updateProductImageInFirebase,
  updateProductInFirebase,
  updateProductStatusInFirebase,
} from "./firebasePrendas";

export function fetchCatalog(filters = {}) {
  return fetchCatalogFromFirebase(filters);
}

export function fetchProductDetail(id) {
  return fetchProductDetailFromFirebase(id);
}

export function fetchOwnProducts() {
  return fetchOwnProductsFromFirebase();
}

export function fetchProductOptions() {
  return fetchProductOptionsFromFirebase();
}

export function createProduct(payload) {
  return createProductInFirebase(payload);
}

export function createProductWithImage(payload, imageFile, secondaryImageFile = null) {
  return createProductWithImageInFirebase(payload, imageFile, secondaryImageFile);
}

export function updateProduct(id, payload) {
  return updateProductInFirebase(id, payload);
}

export function updateProductImage(id, imageFile, secondaryImageFile = null) {
  return updateProductImageInFirebase(id, imageFile, secondaryImageFile);
}

export function deleteProduct(id) {
  return deleteProductInFirebase(id);
}

export function updateProductStatus(id, statusAction) {
  return updateProductStatusInFirebase(id, statusAction);
}
