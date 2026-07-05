import {
  createClaimInFirebase,
  fetchAdminClaimsFromFirebase,
  fetchOwnClaimsFromFirebase,
  updateAdminClaimInFirebase,
} from "./firebaseReclamos";

export function fetchOwnClaims() {
  return fetchOwnClaimsFromFirebase();
}

export function createClaim(payload) {
  return createClaimInFirebase(payload);
}

export function fetchAdminClaims() {
  return fetchAdminClaimsFromFirebase();
}

export function updateAdminClaim(id, payload) {
  return updateAdminClaimInFirebase(id, payload);
}
