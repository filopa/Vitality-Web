import { auth } from "@/lib/firebase";

export async function authedFetch(url, options = {}) {
  if (typeof window === "undefined") {
    throw new Error("Authenticated requests are only available in the browser.");
  }

  const requestUrl = new URL(url, window.location.href);
  if (requestUrl.origin !== window.location.origin) {
    throw new Error("Authenticated requests must target this application.");
  }

  const currentUser = auth.currentUser;
  const idToken = currentUser ? await currentUser.getIdToken() : null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = new Headers(options.headers);

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (idToken) headers.set("Authorization", `Bearer ${idToken}`);

  const response = await fetch(requestUrl, {
    ...options,
    credentials: "omit",
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("vitality:auth-token-rejected"));
  }

  return response;
}