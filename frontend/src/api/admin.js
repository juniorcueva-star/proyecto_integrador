import {
  banAdminUserInFirebase,
  deleteAdminUserInFirebase,
  deleteAdminProductInFirebase,
  fetchAdminSellerProfileFromFirebase,
  fetchAdminStatsFromFirebase,
  fetchAdminUsersFromFirebase,
  pauseAdminProductInFirebase,
  reactivateAdminUserInFirebase,
} from "./firebaseAdmin";
import { fetchAdminClaims, updateAdminClaim } from "./reclamos";

export function fetchAdminStats() {
  return fetchAdminStatsFromFirebase();
}

export function fetchAdminUsers(searchText = "") {
  return fetchAdminUsersFromFirebase(searchText);
}

export function fetchAdminSellerProfile(id) {
  return fetchAdminSellerProfileFromFirebase(id);
}

export function banAdminUser(id) {
  return banAdminUserInFirebase(id);
}

export function reactivateAdminUser(id) {
  return reactivateAdminUserInFirebase(id);
}

export function deleteAdminUser(id) {
  return deleteAdminUserInFirebase(id);
}

export function pauseAdminProduct(id) {
  return pauseAdminProductInFirebase(id);
}

export function deleteAdminProduct(id) {
  return deleteAdminProductInFirebase(id);
}

export { fetchAdminClaims, updateAdminClaim };
