import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "../lib/firebase";
import { getAuthSession } from "../utils/authStorage";
import { fetchProductDetailFromFirebase } from "./firebasePrendas";

const CLAIMS_COLLECTION = "reclamos";

function ensureSession() {
  const session = getAuthSession();

  if (!session?.usuarioId) {
    throw new Error("Debes iniciar sesión para gestionar tus reclamos.");
  }

  return session;
}

function normalizeClaim(snapshot) {
  return {
    id: snapshot.id,
    ...(snapshot.data() || {}),
  };
}

export async function fetchOwnClaimsFromFirebase() {
  const db = getFirebaseDb();
  const session = ensureSession();
  const claimsQuery = query(
    collection(db, CLAIMS_COLLECTION),
    where("usuarioCreadorId", "==", String(session.usuarioId)),
  );
  const snapshot = await getDocs(claimsQuery);

  return snapshot.docs
    .map(normalizeClaim)
    .sort((left, right) => {
      const leftTime = new Date(left.fechaCreacion || 0).getTime();
      const rightTime = new Date(right.fechaCreacion || 0).getTime();
      return rightTime - leftTime;
    });
}

export async function createClaimInFirebase(payload) {
  const db = getFirebaseDb();
  const session = ensureSession();

  if (!payload.prendaId) {
    throw new Error("Debes seleccionar una prenda para crear el reclamo.");
  }

  const product = payload.comprobanteId
    ? {
        usuarioId: payload.usuarioReportadoId,
        nombre: payload.prendaNombre,
        nombreVendedor: payload.nombreUsuarioReportado,
      }
    : await fetchProductDetailFromFirebase(payload.prendaId);

  if (String(product.usuarioId) === String(session.usuarioId)) {
    throw new Error("No puedes crear un reclamo sobre tu propia prenda.");
  }

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, CLAIMS_COLLECTION), {
    usuarioCreadorId: String(session.usuarioId),
    nombreUsuarioCreador: session.nombre || "Usuario Estilo IA",
    usuarioReportadoId: String(payload.usuarioReportadoId || product.usuarioId || ""),
    nombreUsuarioReportado: product.nombreVendedor || "Vendedor",
    prendaId: String(payload.prendaId),
    nombrePrenda: product.nombre || "Prenda",
    comprobanteId: payload.comprobanteId ? String(payload.comprobanteId) : "",
    origen: payload.comprobanteId ? "COMPRA" : "CATALOGO",
    motivo: payload.motivo,
    descripcion: String(payload.descripcion || "").trim(),
    estado: "PENDIENTE",
    respuestaAdmin: "",
    fechaCreacion: now,
    fechaActualizacion: now,
  });

  const snapshot = await getDoc(docRef);
  return normalizeClaim(snapshot);
}

export async function fetchAdminClaimsFromFirebase() {
  const db = getFirebaseDb();
  const snapshot = await getDocs(collection(db, CLAIMS_COLLECTION));

  return snapshot.docs
    .map(normalizeClaim)
    .sort((left, right) => {
      const leftTime = new Date(left.fechaCreacion || 0).getTime();
      const rightTime = new Date(right.fechaCreacion || 0).getTime();
      return rightTime - leftTime;
    });
}

export async function updateAdminClaimInFirebase(id, payload) {
  const db = getFirebaseDb();
  const claimRef = doc(db, CLAIMS_COLLECTION, String(id));
  const snapshot = await getDoc(claimRef);

  if (!snapshot.exists()) {
    throw new Error("El reclamo no existe.");
  }

  await updateDoc(claimRef, {
    estado: payload.estado,
    respuestaAdmin: payload.respuestaAdmin || "",
    fechaActualizacion: new Date().toISOString(),
  });

  const updatedSnapshot = await getDoc(claimRef);
  return normalizeClaim(updatedSnapshot);
}
