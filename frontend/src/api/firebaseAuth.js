import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "../lib/firebase";

const USERS_COLLECTION = "usuarios";

function buildDefaultProfileFromUser(user, extra = {}) {
  const displayName = String(extra.nombre || user.displayName || "").trim();

  return {
    id: user.uid,
    nombre: displayName || "Usuario Estilo IA",
    email: user.email || "",
    telefono: extra.telefono || "",
    rol: extra.rol || "ROLE_USER",
    estadoUsuario: extra.estadoUsuario || "ACTIVO",
    eliminado: extra.eliminado ?? false,
    proveedor: extra.proveedor || user.providerId || "password",
    fotoUrl: user.photoURL || "",
    creadoEn: extra.creadoEn || new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  };
}

async function upsertUserDocument(user, extra = {}) {
  const db = getFirebaseDb();
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const existingSnapshot = await getDoc(userRef);
  const existingData = existingSnapshot.exists() ? existingSnapshot.data() : {};
  const mergedProfile = {
    ...buildDefaultProfileFromUser(user, extra),
    ...existingData,
    ...Object.fromEntries(
      Object.entries(extra).filter(([, value]) => value !== undefined && value !== null && value !== ""),
    ),
    nombre:
      extra.nombre ||
      existingData.nombre ||
      user.displayName ||
      "Usuario Estilo IA",
    email: user.email || existingData.email || "",
    telefono:
      extra.telefono !== undefined
        ? extra.telefono
        : existingData.telefono || "",
    rol: existingData.rol || extra.rol || "ROLE_USER",
    estadoUsuario: existingData.estadoUsuario || extra.estadoUsuario || "ACTIVO",
    eliminado: existingData.eliminado ?? extra.eliminado ?? false,
    proveedor: extra.proveedor || existingData.proveedor || user.providerData?.[0]?.providerId || "password",
    fotoUrl: user.photoURL || existingData.fotoUrl || "",
    creadoEn: existingData.creadoEn || extra.creadoEn || new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  };

  await setDoc(userRef, mergedProfile, { merge: true });
  return mergedProfile;
}

async function buildSessionFromUser(user, extra = {}) {
  const profile = await upsertUserDocument(user, extra);

  if (profile.eliminado) {
    await signOut(getFirebaseAuth());
    throw new Error("Esta cuenta fue eliminada.");
  }

  if (profile.estadoUsuario === "BANEADO") {
    await signOut(getFirebaseAuth());
    throw new Error("Esta cuenta está suspendida temporalmente.");
  }

  const token = await user.getIdToken();

  return {
    token,
    rol: profile.rol || "ROLE_USER",
    nombre: profile.nombre || user.displayName || "Usuario Estilo IA",
    usuarioId: user.uid,
    email: user.email || profile.email || "",
    telefono: profile.telefono || "",
    authSource: "firebase",
  };
}

async function getCurrentFirebaseUserOrWait() {
  const auth = getFirebaseAuth();

  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      unsubscribe();
      reject(new Error("No se pudo restaurar la sesión de Firebase."));
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        return;
      }

      window.clearTimeout(timeoutId);
      unsubscribe();
      resolve(user);
    });
  });
}

export async function registerWithFirebase(payload) {
  const auth = getFirebaseAuth();
  const credentials = await createUserWithEmailAndPassword(auth, payload.email, payload.password);

  if (payload.nombre?.trim()) {
    await updateProfile(credentials.user, {
      displayName: payload.nombre.trim(),
    });
  }

  return buildSessionFromUser(credentials.user, {
    nombre: payload.nombre?.trim(),
    telefono: payload.telefono?.trim() || "",
    proveedor: "password",
  });
}

export async function loginWithFirebase(payload) {
  const auth = getFirebaseAuth();
  const credentials = await signInWithEmailAndPassword(auth, payload.email, payload.password);
  return buildSessionFromUser(credentials.user);
}

export async function loginWithGoogleFirebase() {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credentials = await signInWithPopup(auth, provider);
  return buildSessionFromUser(credentials.user, {
    proveedor: "google.com",
  });
}

export async function logoutFromFirebase() {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function subscribeToFirebaseSession(callback) {
  const auth = getFirebaseAuth();

  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      const session = await buildSessionFromUser(user);
      callback(session);
    } catch {
      callback(null);
    }
  });
}

export async function fetchOwnFirebaseProfile() {
  const db = getFirebaseDb();
  const currentUser = await getCurrentFirebaseUserOrWait();

  const profile = await upsertUserDocument(currentUser);
  let ownProducts = [];

  try {
    const productsSnapshot = await getDocs(
      query(collection(db, "prendas"), where("usuarioId", "==", currentUser.uid)),
    );
    ownProducts = productsSnapshot.docs
      .map((item) => ({ id: item.id, ...(item.data() || {}) }))
      .filter((item) => !item.eliminado);
  } catch {
    ownProducts = [];
  }

  return {
    usuario: {
      id: currentUser.uid,
      nombre: profile.nombre,
      email: profile.email,
      telefono: profile.telefono || "",
    },
    promedioCalificacion: "Sin datos",
    estadisticas: {
      totalPrendas: ownProducts.length,
      prendasPublicadas: ownProducts.filter((item) => item.estadoPublicacion === "PUBLICADA").length,
      prendasVendidas: ownProducts.filter((item) => item.estadoPublicacion === "VENDIDA").length,
      prendasIntercambiadas: ownProducts.filter((item) => item.estadoPublicacion === "INTERCAMBIADA").length,
    },
  };
}

export async function fetchPublicFirebaseProfile(id) {
  const db = getFirebaseDb();
  const userRef = doc(db, USERS_COLLECTION, String(id));
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    throw new Error("No se encontró el perfil del vendedor en Firebase.");
  }

  const profile = snapshot.data();
  const productsSnapshot = await getDocs(
    query(collection(db, "prendas"), where("usuarioId", "==", String(id))),
  );
  const visibleProducts = productsSnapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() || {}) }))
    .filter((item) => !item.eliminado && item.estadoPublicacion === "PUBLICADA");
  const paymentMethodsSnapshot = await getDocs(
    query(
      collection(db, "metodos_pago"),
      where("usuarioId", "==", String(id)),
      where("activo", "==", true),
    ),
  );
  const visiblePaymentMethods = paymentMethodsSnapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() || {}) }))
    .filter((item) => item.activo !== false);

  return {
    id: String(id),
    nombre: profile.nombre || "Usuario Estilo IA",
    telefono: profile.telefono || "",
    promedioCalificacion: "Sin datos",
    cantidadResenas: 0,
    metodosPago: visiblePaymentMethods,
    resenasRecibidas: [],
    prendasPublicadas: visibleProducts,
  };
}
