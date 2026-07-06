import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "../lib/firebase";

const USERS_COLLECTION = "usuarios";
const PRODUCTS_COLLECTION = "prendas";
const PAYMENT_COLLECTION = "metodos_pago";
const CLAIMS_COLLECTION = "reclamos";
const PAYMENT_PROOFS_COLLECTION = "comprobantes_pago";

function normalizeDocument(snapshot) {
  return {
    id: snapshot.id,
    ...(snapshot.data() || {}),
  };
}

async function fetchCollectionByField(collectionName, field, value) {
  const db = getFirebaseDb();
  const snapshot = await getDocs(
    query(collection(db, collectionName), where(field, "==", value)),
  );
  return snapshot.docs.map((item) => ({ ref: item.ref, data: normalizeDocument(item) }));
}

export async function fetchAdminUsersFromFirebase(searchText = "") {
  const db = getFirebaseDb();
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  const normalizedSearch = String(searchText || "").trim().toLowerCase();

  return snapshot.docs
    .map(normalizeDocument)
    .filter((user) => !user.eliminado)
    .filter((user) => user.rol !== "ROLE_ADMIN")
    .filter((user) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [user.nombre, user.email, user.telefono, user.rol, user.estadoUsuario]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    })
    .sort((left, right) => (left.nombre || "").localeCompare(right.nombre || "", "es"));
}

export async function fetchAdminSellerProfileFromFirebase(id) {
  const db = getFirebaseDb();
  const userSnapshot = await getDoc(doc(db, USERS_COLLECTION, String(id)));

  if (!userSnapshot.exists()) {
    throw new Error("El usuario no existe.");
  }

  const [products, paymentMethods, paymentProofs, purchaseProofs] = await Promise.all([
    fetchCollectionByField(PRODUCTS_COLLECTION, "usuarioId", String(id)),
    fetchCollectionByField(PAYMENT_COLLECTION, "usuarioId", String(id)),
    fetchCollectionByField(PAYMENT_PROOFS_COLLECTION, "vendedorId", String(id)),
    fetchCollectionByField(PAYMENT_PROOFS_COLLECTION, "compradorId", String(id)),
  ]);

  const sortProofs = (items) =>
    items
      .map(({ data }) => data)
      .sort((left, right) => new Date(right.creadoEn || 0) - new Date(left.creadoEn || 0));

  return {
    usuario: normalizeDocument(userSnapshot),
    prendas: products.map(({ data }) => data),
    metodosPago: paymentMethods.map(({ data }) => data),
    comprobantes: sortProofs(paymentProofs),
    compras: sortProofs(purchaseProofs),
  };
}

export async function fetchAdminPaymentProofsFromFirebase() {
  const db = getFirebaseDb();
  const snapshot = await getDocs(collection(db, PAYMENT_PROOFS_COLLECTION));

  return snapshot.docs
    .map(normalizeDocument)
    .sort((left, right) => new Date(right.creadoEn || 0) - new Date(left.creadoEn || 0));
}

export async function fetchAdminStatsFromFirebase() {
  const db = getFirebaseDb();
  const [usersSnapshot, productsSnapshot, claimsSnapshot] = await Promise.all([
    getDocs(collection(db, USERS_COLLECTION)),
    getDocs(collection(db, PRODUCTS_COLLECTION)),
    getDocs(collection(db, CLAIMS_COLLECTION)),
  ]);

  const users = usersSnapshot.docs.map(normalizeDocument);
  const regularUsers = users.filter((item) => item.rol !== "ROLE_ADMIN");
  const products = productsSnapshot.docs.map(normalizeDocument).filter((item) => !item.eliminado);
  const claims = claimsSnapshot.docs.map(normalizeDocument);

  const usuariosTotales = regularUsers.filter((item) => !item.eliminado).length;
  const usuariosActivos = regularUsers.filter(
    (item) => !item.eliminado && (item.estadoUsuario || "ACTIVO") === "ACTIVO",
  ).length;
  const usuariosBaneados = regularUsers.filter(
    (item) => !item.eliminado && ["BANEADO", "PAUSADO"].includes(item.estadoUsuario),
  ).length;
  const prendasPublicadas = products.filter((item) => item.estadoPublicacion === "PUBLICADA").length;
  const soldProducts = products.filter((item) => item.estadoPublicacion === "VENDIDA");
  const prendasVendidas = soldProducts.length;
  const reclamosPendientes = claims.filter((item) =>
    ["PENDIENTE", "EN_REVISION"].includes(item.estado),
  ).length;
  const reclamosResueltos = claims.filter((item) => item.estado === "RESUELTO").length;

  return {
    usuariosTotales,
    usuariosActivos,
    usuariosBaneados,
    prendasPublicadas,
    prendasVendidas,
    reclamosPendientes,
    reclamosResueltos,
  };
}

export async function pauseAdminProductInFirebase(id) {
  const db = getFirebaseDb();
  const productRef = doc(db, PRODUCTS_COLLECTION, String(id));
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    throw new Error("La prenda no existe.");
  }

  await updateDoc(productRef, {
    estadoPublicacion: "PAUSADA",
    actualizadoEn: new Date().toISOString(),
  });

  const updatedSnapshot = await getDoc(productRef);
  return normalizeDocument(updatedSnapshot);
}

export async function deleteAdminProductInFirebase(id) {
  const db = getFirebaseDb();
  const productRef = doc(db, PRODUCTS_COLLECTION, String(id));
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    return;
  }

  await deleteDoc(productRef);
}

export async function banAdminUserInFirebase(id) {
  const db = getFirebaseDb();
  const userRef = doc(db, USERS_COLLECTION, String(id));
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    throw new Error("El usuario no existe.");
  }

  await updateDoc(userRef, {
    estadoUsuario: "PAUSADO",
    actualizadoEn: new Date().toISOString(),
  });

  const products = await fetchCollectionByField(PRODUCTS_COLLECTION, "usuarioId", String(id));
  await Promise.all(
    products.map(({ ref, data }) =>
      updateDoc(ref, {
        estadoPublicacion:
          data.estadoPublicacion === "PUBLICADA" ? "PAUSADA" : data.estadoPublicacion,
        actualizadoEn: new Date().toISOString(),
      }),
    ),
  );

  const updatedSnapshot = await getDoc(userRef);
  return normalizeDocument(updatedSnapshot);
}

export async function reactivateAdminUserInFirebase(id) {
  const db = getFirebaseDb();
  const userRef = doc(db, USERS_COLLECTION, String(id));
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    throw new Error("El usuario no existe.");
  }

  await updateDoc(userRef, {
    estadoUsuario: "ACTIVO",
    actualizadoEn: new Date().toISOString(),
  });

  const updatedSnapshot = await getDoc(userRef);
  return normalizeDocument(updatedSnapshot);
}

export async function deleteAdminUserInFirebase(id) {
  const db = getFirebaseDb();
  const userRef = doc(db, USERS_COLLECTION, String(id));
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    throw new Error("El usuario no existe.");
  }

  const [
    products,
    paymentMethods,
    sellerPaymentProofs,
    buyerPaymentProofs,
    creatorClaims,
    reportedClaims,
  ] = await Promise.all([
    fetchCollectionByField(PRODUCTS_COLLECTION, "usuarioId", String(id)),
    fetchCollectionByField(PAYMENT_COLLECTION, "usuarioId", String(id)),
    fetchCollectionByField(PAYMENT_PROOFS_COLLECTION, "vendedorId", String(id)),
    fetchCollectionByField(PAYMENT_PROOFS_COLLECTION, "compradorId", String(id)),
    fetchCollectionByField(CLAIMS_COLLECTION, "usuarioCreadorId", String(id)),
    fetchCollectionByField(CLAIMS_COLLECTION, "usuarioReportadoId", String(id)),
  ]);

  await Promise.all(
    products.map(({ ref }) => deleteDoc(ref)),
  );
  await Promise.all(
    paymentMethods.map(({ ref }) => deleteDoc(ref)),
  );
  const proofRefs = new Map();
  [...sellerPaymentProofs, ...buyerPaymentProofs].forEach(({ ref }) => {
    proofRefs.set(ref.path, ref);
  });
  await Promise.all([...proofRefs.values()].map((ref) => deleteDoc(ref)));

  const claimRefs = new Map();
  [...creatorClaims, ...reportedClaims].forEach(({ ref }) => {
    claimRefs.set(ref.path, ref);
  });
  await Promise.all([...claimRefs.values()].map((ref) => deleteDoc(ref)));

  await updateDoc(userRef, {
    eliminado: true,
    estadoUsuario: "ELIMINADO",
    actualizadoEn: new Date().toISOString(),
  });
}
