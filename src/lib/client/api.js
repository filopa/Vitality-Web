export async function authedFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("vitality:session-expired"));
  }

  return response;
}

export async function confirmBackendSession() {
  const response = await fetch("/api/auth/session", {
    credentials: "same-origin",
    cache: "no-store",
  });
  const result = await response.json();

  if (!response.ok || !result.success || !result.data?.user?.uid) {
    throw new Error(result.message ?? "The server session could not be verified.");
  }

  return result.data;
}
