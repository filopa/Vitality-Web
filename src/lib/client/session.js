export function clearLegacyClientAuth() {
  try {
    localStorage.removeItem("vitality_token");
    localStorage.removeItem("vitality_user");
  } catch (error) {
    console.error("Could not clear legacy browser auth data:", error);
  }
  document.cookie = "vitality_token=; path=/; max-age=0; SameSite=Lax";
}
