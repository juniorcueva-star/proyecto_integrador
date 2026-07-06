const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

function buildBackendUrl(path) {
  return `${BACKEND_URL}${path}`;
}

async function parseBackendError(response) {
  const rawText = await response.text().catch(() => "");

  if (!rawText) {
    return "La IA devolvió un error sin detalle.";
  }

  try {
    const json = JSON.parse(rawText);
    return (
      json.message ||
      json.error ||
      json.details ||
      json.title ||
      rawText
    );
  } catch {
    return rawText;
  }
}

async function postJson(path, payload) {
  const response = await fetch(buildBackendUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseBackendError(response));
  }

  return response.json();
}

async function postFormData(path, formData) {
  const response = await fetch(buildBackendUrl(path), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseBackendError(response));
  }

  return response.json();
}

export async function generateDescription(payload) {
  const data = await postJson("/api/ia/generar-descripcion", {
    nombre: payload.nombre || "",
    marca: payload.marca || "Otros",
    color: payload.color || "No definido",
    talla: payload.talla || "M",
    categoria: payload.categoria || "POLO",
    estadoFisico: payload.estadoFisico || "BUEN_ESTADO",
    tipoPublicacion: payload.tipoPublicacion || "VENTA",
  });

  return {
    tituloSugerido: data.tituloSugerido || payload.nombre || "",
    descripcion: data.descripcion || "",
    etiquetas: data.etiquetas || [],
  };
}

export async function suggestPrice(payload) {
  const data = await postJson("/api/ia/sugerir-precio", {
    nombre: payload.nombre || "",
    marca: payload.marca || "Otros",
    color: payload.color || "No definido",
    categoria: payload.categoria || "POLO",
    estadoFisico: payload.estadoFisico || "BUEN_ESTADO",
    tipoPublicacion: payload.tipoPublicacion || "VENTA",
    talla: payload.talla || "M",
    limiteReferencias: 6,
  });

  return {
    precioSugerido: data.precioSugerido,
    rangoMinimo: data.rangoMinimo,
    rangoMaximo: data.rangoMaximo,
    razonamiento: data.explicacion || "",
    referenciasCatalogo: data.referenciasCatalogo || [],
  };
}

export async function recommendOutfit(payload) {
  const data = await postJson("/api/ia/recomendar-outfit", {
    estilo: payload.estilo,
    ocasion: payload.ocasion,
    clima: payload.clima,
    estaturaCm: Number(payload.estaturaCm),
    contextura: payload.contextura,
  });

  return {
    modoRespuesta: data.modoRespuesta || "BACKEND_OPENAI",
    resumenPerfilUsuario: data.resumenPerfilUsuario || "",
    perfilVisual: data.perfilVisual || "",
    recomendacionGeneral: data.recomendacionGeneral || "",
    notaPruebaVisual: data.notaPruebaVisual || "",
    prendasSugeridas: data.prendasSugeridas || [],
    razones: data.razones || [],
    pasosSugeridos: data.pasosSugeridos || [],
    referenciasCatalogo: data.referenciasCatalogo || [],
  };
}

export async function recommendLookWithPhoto(payload) {
  const formData = new FormData();
  formData.append("estilo", payload.estilo);
  formData.append("ocasion", payload.ocasion);
  formData.append("clima", payload.clima);
  formData.append("estaturaCm", String(payload.estaturaCm));
  formData.append("contextura", payload.contextura);
  formData.append("foto", payload.foto);

  const data = await postFormData("/api/ia/recomendar-look-con-foto", formData);

  return {
    modoRespuesta: data.modoRespuesta || "BACKEND_OPENAI_VISION",
    resumenPerfilUsuario: data.resumenPerfilUsuario || "",
    perfilVisual: data.perfilVisual || "",
    recomendacionGeneral: data.recomendacionGeneral || "",
    notaPruebaVisual: data.notaPruebaVisual || "",
    prendasSugeridas: data.prendasSugeridas || [],
    razones: data.razones || [],
    pasosSugeridos: data.pasosSugeridos || [],
    referenciasCatalogo: data.referenciasCatalogo || [],
  };
}

export async function adaptCombination(payload) {
  return postJson("/api/ia/adaptar-combinacion", {
    prendaSuperiorId: Number(payload.prendaSuperiorId),
    prendaInferiorId: Number(payload.prendaInferiorId),
    estaturaCm: Number(payload.estaturaCm),
    contextura: payload.contextura,
    ocasion: payload.ocasion,
  });
}

export async function analyzeGarmentPhoto(file) {
  const formData = new FormData();
  formData.append("foto", file);

  return postFormData("/api/ia/analizar-prenda-foto", formData);
}

export async function generateVirtualTryOn(payload) {
  const formData = new FormData();
  formData.append("fotoRostro", payload.fotoRostro);
  formData.append("estaturaCm", String(payload.estaturaCm));
  formData.append("contextura", payload.contextura);
  payload.prendaIds.forEach((id) => {
    formData.append("prendaIds", String(id));
  });

  return postFormData("/api/ia/generar-prueba-virtual", formData);
}
