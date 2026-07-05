import {
  fetchOwnFirebaseProfile,
  fetchPublicFirebaseProfile,
  updateOwnFirebaseProfile,
} from "./firebaseAuth";

export function fetchPublicProfile(id) {
  return fetchPublicFirebaseProfile(id);
}

export function fetchOwnProfile() {
  return fetchOwnFirebaseProfile();
}

export function updateOwnProfile(payload) {
  return updateOwnFirebaseProfile(payload);
}
