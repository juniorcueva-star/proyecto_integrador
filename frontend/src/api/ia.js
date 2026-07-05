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

export function recommendLookWithPhoto(payload) {
  const formData = new FormData();
  formData.append("estilo", payload.estilo);
  formData.append("ocasion", payload.ocasion);
  formData.append("clima", payload.clima);
  formData.append("estaturaCm", String(payload.estaturaCm));
  formData.append("contextura", payload.contextura);
  formData.append("foto", payload.foto);

  return apiRequest("/ia/recomendar-look-con-foto", {
    method: "POST",
    body: formData,
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
