import { BACKEND_ORIGIN } from "../config";

export function resolveBackendMedia(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_ORIGIN}${url}`;
}
