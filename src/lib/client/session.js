const TOKEN_KEY = "vitality_token";
const USER_KEY = "vitality_user";

export function clearStoredSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function mergeStoredUser(patch) {
  try {
    const current = JSON.parse(localStorage.getItem(USER_KEY) ?? "{}");
    localStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {}
}
