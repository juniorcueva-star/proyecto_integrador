import {
  createPaymentMethodInFirebase,
  deletePaymentMethodInFirebase,
  fetchOwnPaymentMethodsFromFirebase,
  togglePaymentMethodInFirebase,
} from "./firebaseMetodosPago";

export function fetchOwnPaymentMethods() {
  return fetchOwnPaymentMethodsFromFirebase();
}

export function createPaymentMethod(payload, qrFile = null) {
  return createPaymentMethodInFirebase(payload, qrFile);
}

export function togglePaymentMethod(id, active) {
  return togglePaymentMethodInFirebase(id, active);
}

export function deletePaymentMethod(id) {
  return deletePaymentMethodInFirebase(id);
}
