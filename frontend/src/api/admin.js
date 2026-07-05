import {
  banAdminUserInFirebase,
  deleteAdminUserInFirebase,
  fetchAdminStatsFromFirebase,
  fetchAdminUsersFromFirebase,
  reactivateAdminUserInFirebase,
} from "./firebaseAdmin";
import { fetchAdminClaims, updateAdminClaim } from "./reclamos";

export function fetchAdminStats() {
  return fetchAdminStatsFromFirebase();
}

export function fetchAdminUsers(searchText = "") {
  return fetchAdminUsersFromFirebase(searchText);
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

export { fetchAdminClaims, updateAdminClaim };
