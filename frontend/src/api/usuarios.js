import { fetchOwnFirebaseProfile, fetchPublicFirebaseProfile } from "./firebaseAuth";

export function fetchPublicProfile(id) {
  return fetchPublicFirebaseProfile(id);
}

export function fetchOwnProfile() {
  return fetchOwnFirebaseProfile();
}
