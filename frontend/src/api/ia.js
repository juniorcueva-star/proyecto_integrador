import { apiRequest } from "./client";

export function generateDescription(payload) {
  return apiRequest("/ia/generar-descripcion", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function suggestPrice(payload) {
  return apiRequest("/ia/sugerir-precio", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function recommendOutfit(payload) {
  return apiRequest("/ia/recomendar-outfit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adaptCombination(payload) {
  return apiRequest("/ia/adaptar-combinacion", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function analyzeGarmentPhoto(file) {
  const formData = new FormData();
  formData.append("foto", file);

  return apiRequest("/ia/analizar-prenda-foto", {
    method: "POST",
    body: formData,
  });
}
