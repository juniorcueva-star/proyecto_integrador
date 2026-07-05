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
import { garmentOptions } from "../data/staticData";
import { getAuthSession } from "../utils/authStorage";
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from "../lib/firebase";

const PRENDAS_COLLECTION = "prendas";
const USERS_COLLECTION = "usuarios";

const firebaseBrandOptions = {
  marcasReconocidas: [
    "Nike",
    "Adidas",
    "Puma",
    "H&M",
    "Zara",
    "Reebok",
    "Levi's",
    "Under Armour",
    "Tommy Hilfiger",
  ],
  opcionOtraMarca: "OTRA",
};

const firebaseProductOptions = {
  ...firebaseBrandOptions,
  categorias: garmentOptions.categorias,
  tallas: garmentOptions.tallas,
  estadosFisicos: garmentOptions.estadosFisicos,
  tiposPublicacion: garmentOptions.tiposPublicacion,
};

function normalizeFirestoreProduct(snapshot) {
  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    ...data,
  };
}

function ensureAuthenticatedUser() {
  const session = getAuthSession();
  const currentUser = getFirebaseAuth().currentUser;
  const usuarioId = currentUser?.uid || session?.usuarioId;

  if (!usuarioId) {
    throw new Error("Debes iniciar sesión para gestionar tus prendas.");
  }

  return {
    ...session,
    usuarioId,
    nombre: session?.nombre || currentUser?.displayName || "Usuario Estilo IA",
    email: session?.email || currentUser?.email || "",
  };
}

function mapStatusActionToState(statusAction) {
  switch (statusAction) {
    case "vendida":
      return "VENDIDA";
    case "intercambiada":
      return "INTERCAMBIADA";
    case "pausar":
      return "PAUSADA";
    case "publicar":
      return "PUBLICADA";
    default:
      throw new Error("La acción de estado no es válida.");
  }
}

function matchesFilters(product, filters = {}) {
  const normalizedSearch = String(filters.texto || "")
    .trim()
    .toLowerCase();
  const min = filters.precioMinimo ? Number(filters.precioMinimo) : null;
  const max = filters.precioMaximo ? Number(filters.precioMaximo) : null;
  const price = Number(product.precio || 0);

  if (product.eliminado || product.estadoPublicacion !== "PUBLICADA") {
    return false;
  }

  if (filters.genero && product.genero !== filters.genero) {
    return false;
  }

  if (filters.categoria && product.categoria !== filters.categoria) {
    return false;
  }

  if (min !== null && price < min) {
    return false;
  }

  if (max !== null && price > max) {
    return false;
  }

  if (!normalizedSearch) {
    return true;
  }

  const haystack = [
    product.nombre,
    product.marca,
    product.descripcion,
    product.color,
    product.nombreVendedor,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedSearch);
}

async function fetchUserVisibilityMap(userIds = []) {
  const db = getFirebaseDb();
  const visibilityMap = new Map();
  const uniqueUserIds = [...new Set(userIds.map((item) => String(item)).filter(Boolean))];

  const snapshots = await Promise.all(
    uniqueUserIds.map((userId) => getDoc(doc(db, USERS_COLLECTION, userId))),
  );

  snapshots.forEach((snapshot, index) => {
    const userId = uniqueUserIds[index];

    if (!snapshot.exists()) {
      visibilityMap.set(userId, {
        eliminado: true,
        estadoUsuario: "ELIMINADO",
      });
      return;
    }

    const data = snapshot.data() || {};
    visibilityMap.set(userId, {
      eliminado: Boolean(data.eliminado),
      estadoUsuario: data.estadoUsuario || "ACTIVO",
    });
  });

  return visibilityMap;
}

async function uploadProductImage(imageFile, userId) {
  const storage = getFirebaseStorage();
  const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const objectRef = ref(storage, `prendas/${userId}/${Date.now()}-${safeName}`);

  await uploadBytes(objectRef, imageFile);
  return getDownloadURL(objectRef);
}

function buildFirebaseProductPayload(payload, currentImageUrl = "") {
  const session = ensureAuthenticatedUser();
  const now = new Date();
  const price = Number(payload.precio || 0);
  const selectedBrand = String(payload.marca || "").trim();
  const customBrand = String(payload.marcaPersonalizada || "").trim();
  const finalBrand =
    selectedBrand === firebaseBrandOptions.opcionOtraMarca && customBrand
      ? customBrand
      : selectedBrand;

  return {
    nombre: String(payload.nombre || "").trim(),
    descripcion: String(payload.descripcion || "").trim(),
    marca: finalBrand,
    genero: payload.genero || "UNISEX",
    color: String(payload.color || "").trim(),
    talla: payload.talla || "M",
    categoria: payload.categoria || "POLO",
    estadoFisico: payload.estadoFisico || "BUEN_ESTADO",
    precio: Number.isFinite(price) ? price : 0,
    tipoPublicacion: payload.tipoPublicacion || "VENTA",
    estadoPublicacion: payload.estadoPublicacion || "PUBLICADA",
    contacto: String(payload.contacto || "").trim(),
    imagenUrl: String(payload.imagenUrl || currentImageUrl || "").trim(),
    usuarioId: String(session.usuarioId),
    nombreVendedor: session.nombre || "Usuario Estilo IA",
    eliminado: false,
    fechaPublicacion: payload.fechaPublicacion || now.toISOString(),
    fechaPublicacionMs: payload.fechaPublicacionMs || now.getTime(),
    actualizadoEn: now.toISOString(),
  };
}

export async function fetchCatalogFromFirebase(filters = {}) {
  const db = getFirebaseDb();
  const prendasQuery = query(
    collection(db, PRENDAS_COLLECTION),
    where("eliminado", "==", false),
    where("estadoPublicacion", "==", "PUBLICADA"),
  );
  const snapshot = await getDocs(prendasQuery);
  const rawProducts = snapshot.docs.map(normalizeFirestoreProduct);
  const userVisibilityMap = await fetchUserVisibilityMap(
    rawProducts.map((product) => product.usuarioId),
  );

  return rawProducts
    .filter((product) => {
      const userState = userVisibilityMap.get(String(product.usuarioId));
      return userState && !userState.eliminado && userState.estadoUsuario === "ACTIVO";
    })
    .filter((product) => matchesFilters(product, filters))
    .sort((left, right) => (right.fechaPublicacionMs || 0) - (left.fechaPublicacionMs || 0));
}

export async function fetchProductDetailFromFirebase(id) {
  const db = getFirebaseDb();
  const productRef = doc(db, PRENDAS_COLLECTION, String(id));
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    throw new Error("La prenda no existe en Firebase.");
  }

  const product = normalizeFirestoreProduct(snapshot);

  if (product.eliminado) {
    throw new Error("La prenda fue eliminada.");
  }

  const userSnapshot = await getDoc(doc(db, USERS_COLLECTION, String(product.usuarioId)));
  const userData = userSnapshot.exists() ? userSnapshot.data() || {} : null;

  if (!userData || userData.eliminado || userData.estadoUsuario === "BANEADO") {
    throw new Error("La prenda no está disponible mientras la cuenta del vendedor esté suspendida.");
  }

  return product;
}

export async function fetchOwnProductsFromFirebase() {
  const db = getFirebaseDb();
  const session = ensureAuthenticatedUser();
  const prendasQuery = query(
    collection(db, PRENDAS_COLLECTION),
    where("usuarioId", "==", String(session.usuarioId)),
  );
  const snapshot = await getDocs(prendasQuery);

  return snapshot.docs
    .map(normalizeFirestoreProduct)
    .filter((product) => !product.eliminado)
    .sort((left, right) => (right.fechaPublicacionMs || 0) - (left.fechaPublicacionMs || 0));
}

export async function createProductInFirebase(payload) {
  const db = getFirebaseDb();
  const productPayload = buildFirebaseProductPayload(payload);
  const docRef = await addDoc(collection(db, PRENDAS_COLLECTION), productPayload);
  const snapshot = await getDoc(docRef);
  return normalizeFirestoreProduct(snapshot);
}

export async function createProductWithImageInFirebase(payload, imageFile) {
  const session = ensureAuthenticatedUser();
  const imageUrl = imageFile
    ? await uploadProductImage(imageFile, String(session.usuarioId))
    : String(payload.imagenUrl || "").trim();

  return createProductInFirebase({
    ...payload,
    imagenUrl: imageUrl,
  });
}

export async function updateProductInFirebase(id, payload) {
  const db = getFirebaseDb();
  const productRef = doc(db, PRENDAS_COLLECTION, String(id));
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    throw new Error("La prenda no existe en Firebase.");
  }

  const currentProduct = normalizeFirestoreProduct(snapshot);
  const session = ensureAuthenticatedUser();

  if (String(currentProduct.usuarioId) !== String(session.usuarioId)) {
    throw new Error("No puedes editar una prenda que no te pertenece.");
  }

  const nextPayload = buildFirebaseProductPayload(
    {
      ...currentProduct,
      ...payload,
      fechaPublicacion: currentProduct.fechaPublicacion,
      fechaPublicacionMs: currentProduct.fechaPublicacionMs,
    },
    currentProduct.imagenUrl,
  );

  await updateDoc(productRef, nextPayload);
  const updatedSnapshot = await getDoc(productRef);
  return normalizeFirestoreProduct(updatedSnapshot);
}

export async function updateProductImageInFirebase(id, imageFile) {
  const db = getFirebaseDb();
  const session = ensureAuthenticatedUser();
  const productRef = doc(db, PRENDAS_COLLECTION, String(id));
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    throw new Error("La prenda no existe en Firebase.");
  }

  const currentProduct = normalizeFirestoreProduct(snapshot);

  if (String(currentProduct.usuarioId) !== String(session.usuarioId)) {
    throw new Error("No puedes editar una prenda que no te pertenece.");
  }

  const imageUrl = await uploadProductImage(imageFile, String(session.usuarioId));
  await updateDoc(productRef, {
    imagenUrl: imageUrl,
    actualizadoEn: new Date().toISOString(),
  });

  const updatedSnapshot = await getDoc(productRef);
  return normalizeFirestoreProduct(updatedSnapshot);
}

export async function deleteProductInFirebase(id) {
  const db = getFirebaseDb();
  const session = ensureAuthenticatedUser();
  const productRef = doc(db, PRENDAS_COLLECTION, String(id));
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    return;
  }

  const currentProduct = normalizeFirestoreProduct(snapshot);

  if (String(currentProduct.usuarioId) !== String(session.usuarioId)) {
    throw new Error("No puedes eliminar una prenda que no te pertenece.");
  }

  await deleteDoc(productRef);
}

export async function updateProductStatusInFirebase(id, statusAction) {
  const db = getFirebaseDb();
  const session = ensureAuthenticatedUser();
  const productRef = doc(db, PRENDAS_COLLECTION, String(id));
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    throw new Error("La prenda no existe en Firebase.");
  }

  const currentProduct = normalizeFirestoreProduct(snapshot);

  if (String(currentProduct.usuarioId) !== String(session.usuarioId)) {
    throw new Error("No puedes actualizar una prenda que no te pertenece.");
  }

  await updateDoc(productRef, {
    estadoPublicacion: mapStatusActionToState(statusAction),
    actualizadoEn: new Date().toISOString(),
  });

  const updatedSnapshot = await getDoc(productRef);
  return normalizeFirestoreProduct(updatedSnapshot);
}

export async function fetchProductOptionsFromFirebase() {
  return firebaseProductOptions;
}
