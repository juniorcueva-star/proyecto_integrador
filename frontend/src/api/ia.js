import { fetchCatalogFromFirebase, fetchProductDetailFromFirebase } from "./firebasePrendas";
import { generateGeminiJson } from "../lib/gemini";

const garmentAnalysisSchema = {
  type: "object",
  properties: {
    nombre: { type: "string" },
    descripcion: { type: "string" },
    marca: { type: "string" },
    genero: { type: "string" },
    color: { type: "string" },
    talla: { type: "string" },
    categoria: { type: "string" },
    estadoFisico: { type: "string" },
    precio: { type: "number" },
    tipoPublicacion: { type: "string" },
  },
  required: [
    "nombre",
    "descripcion",
    "marca",
    "genero",
    "color",
    "talla",
    "categoria",
    "estadoFisico",
    "precio",
    "tipoPublicacion",
  ],
};

const outfitSchema = {
  type: "object",
  properties: {
    resumenPerfilUsuario: { type: "string" },
    recomendacionGeneral: { type: "string" },
    razones: {
      type: "array",
      items: { type: "string" },
    },
    prendasSugeridas: {
      type: "array",
      items: { type: "string" },
    },
    pasosSugeridos: {
      type: "array",
      items: { type: "string" },
    },
    idsRecomendados: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "resumenPerfilUsuario",
    "recomendacionGeneral",
    "razones",
    "prendasSugeridas",
    "pasosSugeridos",
    "idsRecomendados",
  ],
};

const descriptionSchema = {
  type: "object",
  properties: {
    descripcion: { type: "string" },
  },
  required: ["descripcion"],
};

const priceSchema = {
  type: "object",
  properties: {
    precioSugerido: { type: "number" },
    razonamiento: { type: "string" },
  },
  required: ["precioSugerido", "razonamiento"],
};

const combinationSchema = {
  type: "object",
  properties: {
    resumen: { type: "string" },
    recomendacion: { type: "string" },
    observaciones: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["resumen", "recomendacion", "observaciones"],
};

function buildCatalogContext(products) {
  return products
    .slice(0, 40)
    .map((product) => (
      `ID: ${product.id}; nombre: ${product.nombre}; marca: ${product.marca}; ` +
      `categoria: ${product.categoria}; talla: ${product.talla}; color: ${product.color}; ` +
      `precio: ${product.precio}; genero: ${product.genero}; estado: ${product.estadoFisico}.`
    ))
    .join("\n");
}

function resolveRecommendedProducts(products, ids = []) {
  const wanted = new Set(ids.map((item) => String(item)));
  return products.filter((product) => wanted.has(String(product.id)));
}

export async function generateDescription(payload) {
  const data = await generateGeminiJson({
    prompt: `
Genera una descripción breve, clara y vendedora para una prenda de segunda mano.
Nombre: ${payload.nombre || ""}
Marca: ${payload.marca || ""}
Color: ${payload.color || ""}
Categoría: ${payload.categoria || ""}
Estado físico: ${payload.estadoFisico || ""}
Tipo de publicación: ${payload.tipoPublicacion || ""}

La descripción debe sonar natural, honesta y lista para marketplace.
    `.trim(),
    schema: descriptionSchema,
  });

  return {
    descripcion: data.descripcion,
  };
}

export async function suggestPrice(payload) {
  const data = await generateGeminiJson({
    prompt: `
Sugiere un precio razonable en soles peruanos para una prenda de segunda mano.
Nombre: ${payload.nombre || ""}
Marca: ${payload.marca || ""}
Categoría: ${payload.categoria || ""}
Estado físico: ${payload.estadoFisico || ""}
Descripción: ${payload.descripcion || ""}

Devuelve un precio realista y un razonamiento corto.
    `.trim(),
    schema: priceSchema,
  });

  return {
    precioSugerido: data.precioSugerido,
    razonamiento: data.razonamiento,
  };
}

export async function recommendOutfit(payload) {
  const catalog = await fetchCatalogFromFirebase({});
  const catalogContext = buildCatalogContext(catalog);

  const data = await generateGeminiJson({
    prompt: `
Eres estilista para una app de moda circular.
Perfil del usuario:
- Estilo: ${payload.estilo}
- Ocasión: ${payload.ocasion}
- Clima: ${payload.clima}
- Estatura: ${payload.estaturaCm} cm
- Contextura: ${payload.contextura}

Catálogo disponible:
${catalogContext}

Selecciona prendas reales del catálogo. Devuelve hasta 6 ids recomendados y explica por qué.
    `.trim(),
    schema: outfitSchema,
  });

  const referenciasCatalogo = resolveRecommendedProducts(catalog, data.idsRecomendados);

  return {
    modoRespuesta: "GEMINI_FIREBASE",
    resumenPerfilUsuario: data.resumenPerfilUsuario,
    perfilVisual:
      "Sugerencia basada en estilo, ocasión, clima, estatura y contextura.",
    recomendacionGeneral: data.recomendacionGeneral,
    prendasSugeridas: data.prendasSugeridas,
    razones: data.razones,
    pasosSugeridos: data.pasosSugeridos,
    referenciasCatalogo,
    notaPruebaVisual:
      "La prueba virtual completa requiere un modelo de generación o edición de imagen especializado.",
  };
}

export async function recommendLookWithPhoto(payload) {
  const catalog = await fetchCatalogFromFirebase({});
  const catalogContext = buildCatalogContext(catalog);

  const data = await generateGeminiJson({
    prompt: `
Analiza la foto de una persona y recomienda prendas reales del catálogo.
Perfil del usuario:
- Estilo: ${payload.estilo}
- Ocasión: ${payload.ocasion}
- Clima: ${payload.clima}
- Estatura: ${payload.estaturaCm} cm
- Contextura: ${payload.contextura}

Catálogo disponible:
${catalogContext}

No describas tono de piel de forma sensible; enfócate en armonía visual general, combinación y contexto.
Selecciona prendas reales del catálogo.
    `.trim(),
    schema: outfitSchema,
    imageFiles: payload.foto ? [payload.foto] : [],
  });

  const referenciasCatalogo = resolveRecommendedProducts(catalog, data.idsRecomendados);

  return {
    modoRespuesta: "GEMINI_VISION",
    resumenPerfilUsuario: data.resumenPerfilUsuario,
    perfilVisual: "La foto fue analizada para sugerir combinaciones visuales compatibles.",
    recomendacionGeneral: data.recomendacionGeneral,
    prendasSugeridas: data.prendasSugeridas,
    razones: data.razones,
    pasosSugeridos: data.pasosSugeridos,
    referenciasCatalogo,
  };
}

export async function adaptCombination(payload) {
  const superior = await fetchProductDetailFromFirebase(payload.prendaSuperiorId);
  const inferior = await fetchProductDetailFromFirebase(payload.prendaInferiorId);

  const data = await generateGeminiJson({
    prompt: `
Evalúa esta combinación de outfit con enfoque práctico.
Prenda superior: ${superior.nombre}, ${superior.color}, ${superior.categoria}, talla ${superior.talla}.
Prenda inferior: ${inferior.nombre}, ${inferior.color}, ${inferior.categoria}, talla ${inferior.talla}.
Estatura: ${payload.estaturaCm || "no indicada"} cm.
Contextura: ${payload.contextura || "no indicada"}.

Da una recomendación breve y observaciones útiles.
    `.trim(),
    schema: combinationSchema,
  });

  return {
    resumen: data.resumen,
    recomendacion: data.recomendacion,
    observaciones: data.observaciones,
    prendaSuperior: superior,
    prendaInferior: inferior,
  };
}

export async function analyzeGarmentPhoto(file) {
  return generateGeminiJson({
    prompt: `
Analiza la foto de una prenda para un marketplace de moda circular.

Reglas:
- Usa un nombre natural y vendible.
- Si no reconoces la marca, usa "Otros".
- Género permitido: HOMBRE, MUJER, UNISEX.
- Talla permitida: XS, S, M, L, XL, XXL, TALLA_28, TALLA_30, TALLA_32, TALLA_34, TALLA_36, TALLA_38, TALLA_40, TALLA_42, UNICA.
- Categoría permitida: POLO, CAMISA, PANTALON, SHORT, CASACA, CHOMPA, VESTIDO, FALDA, ZAPATOS, ZAPATILLAS, ACCESORIO, OTRO.
- Estado físico permitido: NUEVA, BUEN_ESTADO, USADA, DESGASTADA.
- Tipo de publicación permitido: VENTA, INTERCAMBIO, VENTA_E_INTERCAMBIO.
- Devuelve un precio sugerido en soles.
    `.trim(),
    schema: garmentAnalysisSchema,
    imageFiles: [file],
  });
}

export async function generateVirtualTryOn(payload) {
  const prendasSeleccionadas = await Promise.all(
    payload.prendaIds.map((id) => fetchProductDetailFromFirebase(id)),
  );

  return {
    estado: "PENDIENTE_MODELO_IMAGEN",
    mensaje:
      "La lógica ya está migrada fuera del backend. Para generar una imagen real de prueba virtual aún necesitamos conectar un modelo especializado de imagen.",
    imagenUrl: "",
    prendasSeleccionadas,
    estaturaCm: payload.estaturaCm,
    contextura: payload.contextura,
  };
}
