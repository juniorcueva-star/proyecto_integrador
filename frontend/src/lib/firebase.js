import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => Boolean(String(value).trim()));
}

let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let firebaseStorage = null;

function ensureFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Falta configurar Firebase en el frontend. Completa las variables VITE_FIREBASE_*.",
    );
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firestoreDb = getFirestore(firebaseApp);
    firebaseStorage = getStorage(firebaseApp);
  }
}

export function getFirebaseAuth() {
  ensureFirebase();
  return firebaseAuth;
}

export function getFirebaseDb() {
  ensureFirebase();
  return firestoreDb;
}

export function getFirebaseStorage() {
  ensureFirebase();
  return firebaseStorage;
}
