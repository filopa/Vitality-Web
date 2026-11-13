import { authedFetch } from "@/lib/client/api";

const CHUNK_SIZE = 50; // the server accepts at most 50 uids per request

async function fetchChunk(uids, signal) {
  const res = await authedFetch("/api/users/batch", {
    method: "POST",
    body: JSON.stringify({ uids }),
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message ?? "Couldn't load users.");
  return json.data.users;
}

/**
 * const people = await getUsersByIds(chat.memberUids);
 * people.get(uid)?.name
 *
 * Returns a Map (uid → public user). Any number of uids is fine (split into requests of 50).
 * Unknown / deleted uids are simply not in the Map.
 */
export async function getUsersByIds(uids, { signal } = {}) {
  const unique = [...new Set(uids)].filter(Boolean);

  const chunks = [];
  for (let i = 0; i < unique.length; i += CHUNK_SIZE) chunks.push(unique.slice(i, i + CHUNK_SIZE));

  const results = await Promise.all(chunks.map((chunk) => fetchChunk(chunk, signal)));
  return new Map(results.flat().map((user) => [user.uid, user]));
}
