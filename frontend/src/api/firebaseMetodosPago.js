import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "../lib/firebase";
import { getAuthSession } from "../utils/authStorage";

const PAYMENT_COLLECTION = "metodos_pago";

function ensureSession() {
  const session = getAuthSession();

  if (!session?.usuarioId) {
    throw new Error("Debes iniciar sesión para gestionar tus métodos de pago.");
  }

  return session;
}

function normalizePayment(snapshot) {
  return {
    id: snapshot.id,
    ...(snapshot.data() || {}),
  };
}

async function uploadPaymentQr(qrFile, userId) {
  if (!qrFile) return "";

  const storage = getFirebaseStorage();
  const safeName = qrFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const objectRef = ref(storage, `metodos-pago/${userId}/${Date.now()}-${safeName}`);

  await uploadBytes(objectRef, qrFile);
  return getDownloadURL(objectRef);
}

export async function fetchOwnPaymentMethodsFromFirebase() {
  const db = getFirebaseDb();
  const session = ensureSession();
  const paymentQuery = query(
    collection(db, PAYMENT_COLLECTION),
    where("usuarioId", "==", String(session.usuarioId)),
  );
  const snapshot = await getDocs(paymentQuery);

  return snapshot.docs
    .map(normalizePayment)
    .sort((left, right) => {
      const leftTime = new Date(left.creadoEn || 0).getTime();
      const rightTime = new Date(right.creadoEn || 0).getTime();
      return rightTime - leftTime;
    });
}

export async function createPaymentMethodInFirebase(payload, qrFile = null) {
  const db = getFirebaseDb();
  const session = ensureSession();
  const now = new Date().toISOString();
  const qrUrl = await uploadPaymentQr(qrFile, String(session.usuarioId));
  const docRef = await addDoc(collection(db, PAYMENT_COLLECTION), {
    tipoMetodoPago: payload.tipoMetodoPago,
    numero: String(payload.numero || "").trim(),
    titular: String(payload.titular || "").trim(),
    instrucciones: String(payload.instrucciones || "").trim(),
    qrUrl,
    usuarioId: String(session.usuarioId),
    nombreUsuario: session.nombre || "Usuario Estilo IA",
    activo: true,
    creadoEn: now,
    actualizadoEn: now,
  });

  const snapshot = await getDoc(docRef);
  return normalizePayment(snapshot);
}

export async function togglePaymentMethodInFirebase(id, active) {
  const db = getFirebaseDb();
  const session = ensureSession();
  const paymentRef = doc(db, PAYMENT_COLLECTION, String(id));
  const snapshot = await getDoc(paymentRef);

  if (!snapshot.exists()) {
    throw new Error("El método de pago no existe.");
  }

  const currentPayment = normalizePayment(snapshot);

  if (String(currentPayment.usuarioId) !== String(session.usuarioId)) {
    throw new Error("No puedes editar un método de pago que no te pertenece.");
  }

  await updateDoc(paymentRef, {
    activo: Boolean(active),
    actualizadoEn: new Date().toISOString(),
  });

  const updatedSnapshot = await getDoc(paymentRef);
  return normalizePayment(updatedSnapshot);
}

export async function deletePaymentMethodInFirebase(id) {
  const db = getFirebaseDb();
  const session = ensureSession();
  const paymentRef = doc(db, PAYMENT_COLLECTION, String(id));
  const snapshot = await getDoc(paymentRef);

  if (!snapshot.exists()) {
    return;
  }

  const currentPayment = normalizePayment(snapshot);

  if (String(currentPayment.usuarioId) !== String(session.usuarioId)) {
    throw new Error("No puedes eliminar un método de pago que no te pertenece.");
  }

  await deleteDoc(paymentRef);
}
