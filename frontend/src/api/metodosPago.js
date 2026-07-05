import {
  createPaymentMethodInFirebase,
  deletePaymentMethodInFirebase,
  fetchOwnPaymentMethodsFromFirebase,
  togglePaymentMethodInFirebase,
} from "./firebaseMetodosPago";

export function fetchOwnPaymentMethods() {
  return fetchOwnPaymentMethodsFromFirebase();
}

export function createPaymentMethod(payload) {
  return createPaymentMethodInFirebase(payload);
}

export function togglePaymentMethod(id, active) {
  return togglePaymentMethodInFirebase(id, active);
}

export function deletePaymentMethod(id) {
  return deletePaymentMethodInFirebase(id);
}
