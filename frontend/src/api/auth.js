import {
  loginWithFirebase,
  loginWithGoogleFirebase,
  logoutFromFirebase,
  registerWithFirebase,
  subscribeToFirebaseSession,
} from "./firebaseAuth";

export function loginRequest(payload) {
  return loginWithFirebase(payload);
}

export function registerRequest(payload) {
  return registerWithFirebase(payload);
}

export function loginWithGoogle() {
  return loginWithGoogleFirebase();
}

export function logoutRequest() {
  return logoutFromFirebase();
}

export function subscribeToAuthSession(callback) {
  return subscribeToFirebaseSession(callback);
}
