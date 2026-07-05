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

export async function fetchAdminStatsFromFirebase() {
  const db = getFirebaseDb();
  const [usersSnapshot, productsSnapshot, claimsSnapshot] = await Promise.all([
    getDocs(collection(db, USERS_COLLECTION)),
    getDocs(collection(db, PRODUCTS_COLLECTION)),
    getDocs(collection(db, CLAIMS_COLLECTION)),
  ]);

  const users = usersSnapshot.docs.map(normalizeDocument);
  const products = productsSnapshot.docs.map(normalizeDocument).filter((item) => !item.eliminado);
  const claims = claimsSnapshot.docs.map(normalizeDocument);

  const usuariosTotales = users.filter((item) => !item.eliminado).length;
  const usuariosActivos = users.filter(
    (item) => !item.eliminado && (item.estadoUsuario || "ACTIVO") === "ACTIVO",
  ).length;
  const usuariosBaneados = users.filter(
    (item) => !item.eliminado && item.estadoUsuario === "BANEADO",
  ).length;
  const prendasPublicadas = products.filter((item) => item.estadoPublicacion === "PUBLICADA").length;
  const prendasVendidas = products.filter((item) => item.estadoPublicacion === "VENDIDA").length;
  const prendasIntercambiadas = products.filter(
    (item) => item.estadoPublicacion === "INTERCAMBIADA",
  ).length;
  const prendasReutilizadas = prendasVendidas + prendasIntercambiadas;

  return {
    usuariosTotales,
    usuariosActivos,
    usuariosBaneados,
    prendasPublicadas,
    prendasVendidas,
    prendasIntercambiadas,
    reclamosTotales: claims.length,
    prendasReutilizadas,
    impactoAmbientalEstimadoKgCo2: Number((prendasReutilizadas * 2.5).toFixed(2)),
  };
}

export async function banAdminUserInFirebase(id) {
  const db = getFirebaseDb();
  const userRef = doc(db, USERS_COLLECTION, String(id));
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    throw new Error("El usuario no existe.");
  }

  await updateDoc(userRef, {
    estadoUsuario: "BANEADO",
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

  const [products, paymentMethods, creatorClaims, reportedClaims] = await Promise.all([
    fetchCollectionByField(PRODUCTS_COLLECTION, "usuarioId", String(id)),
    fetchCollectionByField(PAYMENT_COLLECTION, "usuarioId", String(id)),
    fetchCollectionByField(CLAIMS_COLLECTION, "usuarioCreadorId", String(id)),
    fetchCollectionByField(CLAIMS_COLLECTION, "usuarioReportadoId", String(id)),
  ]);

  await Promise.all(
    products.map(({ ref }) => deleteDoc(ref)),
  );
  await Promise.all(
    paymentMethods.map(({ ref }) => deleteDoc(ref)),
  );

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
