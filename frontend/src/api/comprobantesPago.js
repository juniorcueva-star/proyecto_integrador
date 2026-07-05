import { addDoc, collection, getDoc, getDocs, doc, query, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from "../lib/firebase";
import { getAuthSession } from "../utils/authStorage";

const PAYMENT_PROOFS_COLLECTION = "comprobantes_pago";

function ensureBuyerSession() {
  const session = getAuthSession();
  const currentUser = getFirebaseAuth().currentUser;
  const compradorId = currentUser?.uid || session?.usuarioId;

  if (!compradorId) {
    throw new Error("Debes iniciar sesion para subir un comprobante.");
  }

  return {
    compradorId,
    compradorNombre: session.nombre || currentUser?.displayName || "Comprador Estilo IA",
    compradorEmail: session.email || currentUser?.email || "",
  };
}

async function uploadPaymentProofImage(file, vendedorId, compradorId) {
  const storage = getFirebaseStorage();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const objectRef = ref(
    storage,
    `comprobantes-pago/${vendedorId}/${compradorId}/${Date.now()}-${safeName}`,
  );

  await uploadBytes(objectRef, file);
  return getDownloadURL(objectRef);
}

function normalizeProof(snapshot) {
  return {
    id: snapshot.id,
    ...(snapshot.data() || {}),
  };
}

function sortProofsByDate(proofs) {
  return proofs.sort((left, right) => {
    const leftTime = new Date(left.creadoEn || 0).getTime();
    const rightTime = new Date(right.creadoEn || 0).getTime();
    return rightTime - leftTime;
  });
}

export async function uploadPaymentProof(payload, file) {
  if (!file) {
    throw new Error("Selecciona una imagen del comprobante de pago.");
  }

  if (!payload?.vendedorId || !payload?.prendaId) {
    throw new Error("Faltan datos de la prenda o del vendedor.");
  }

  const db = getFirebaseDb();
  const buyer = ensureBuyerSession();
  const comprobanteUrl = await uploadPaymentProofImage(
    file,
    String(payload.vendedorId),
    String(buyer.compradorId),
  );

  const docRef = await addDoc(collection(db, PAYMENT_PROOFS_COLLECTION), {
    compradorId: String(buyer.compradorId),
    compradorNombre: buyer.compradorNombre,
    compradorEmail: buyer.compradorEmail,
    vendedorId: String(payload.vendedorId),
    vendedorNombre: payload.vendedorNombre || "",
    prendaId: String(payload.prendaId),
    prendaNombre: payload.prendaNombre || "",
    monto: Number(payload.monto || 0),
    comprobanteUrl,
    estado: "PENDIENTE",
    creadoEn: new Date().toISOString(),
  });

  const snapshot = await getDoc(doc(db, PAYMENT_PROOFS_COLLECTION, docRef.id));
  return {
    id: snapshot.id,
    ...(snapshot.data() || {}),
  };
}

export async function fetchOwnPurchaseProofs() {
  const db = getFirebaseDb();
  const buyer = ensureBuyerSession();
  const snapshot = await getDocs(
    query(
      collection(db, PAYMENT_PROOFS_COLLECTION),
      where("compradorId", "==", String(buyer.compradorId)),
    ),
  );

  return sortProofsByDate(snapshot.docs.map(normalizeProof));
}

export async function fetchOwnSalesProofs() {
  const db = getFirebaseDb();
  const session = getAuthSession();
  const currentUser = getFirebaseAuth().currentUser;
  const vendedorId = currentUser?.uid || session?.usuarioId;

  if (!vendedorId) {
    throw new Error("Debes iniciar sesion para ver tus ventas.");
  }

  const snapshot = await getDocs(
    query(
      collection(db, PAYMENT_PROOFS_COLLECTION),
      where("vendedorId", "==", String(vendedorId)),
    ),
  );

  return sortProofsByDate(snapshot.docs.map(normalizeProof));
}

export async function fetchAdminPaymentProofs() {
  const db = getFirebaseDb();
  const snapshot = await getDocs(collection(db, PAYMENT_PROOFS_COLLECTION));
  return sortProofsByDate(snapshot.docs.map(normalizeProof));
}
