import { authedFetch } from "@/lib/client/api";

/**
 * const users = await searchUsers("ahmed");
 * users[0].uid  → the id you send to your backend
 */
export async function searchUsers(query, { limit = 10, signal } = {}) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await authedFetch(`/api/users/search?${params}`, { signal });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) throw new Error(json.message ?? "Search failed.");
  return json.data.users;
}
