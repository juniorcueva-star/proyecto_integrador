const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function ensureGeminiConfigured() {
  if (!GEMINI_API_KEY.trim()) {
    throw new Error(
      "Falta configurar VITE_GEMINI_API_KEY para usar la IA sin backend.",
    );
  }
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

async function fileToInlinePart(file) {
  const buffer = await file.arrayBuffer();
  return {
    inlineData: {
      mimeType: file.type || "image/jpeg",
      data: arrayBufferToBase64(buffer),
    },
  };
}

function extractTextFromGeminiResponse(payload) {
  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const textPart = parts.find((part) => typeof part.text === "string");

  if (!textPart?.text) {
    throw new Error("La IA no devolvió contenido utilizable.");
  }

  return textPart.text.trim();
}

function cleanJsonText(rawText) {
  return rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function generateGeminiJson({ prompt, schema, imageFiles = [] }) {
  ensureGeminiConfigured();

  const imageParts = await Promise.all(imageFiles.map(fileToInlinePart));
  const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...imageParts,
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      "La API de Gemini devolvió un error.";
    throw new Error(message);
  }

  const rawText = extractTextFromGeminiResponse(payload);

  try {
    return JSON.parse(cleanJsonText(rawText));
  } catch {
    throw new Error("La IA devolvió una respuesta inválida.");
  }
}
