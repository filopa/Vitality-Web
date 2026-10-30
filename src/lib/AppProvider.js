"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { clearLegacyClientAuth } from "./client/session";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const THEME_STORAGE_KEY = "theme";

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.user?.uid) {
        setUser(null);
        setUserData(null);
        return false;
      }

      setUser({ uid: result.data.user.uid });
      setUserData(result.data.user);
      return true;
    } catch (error) {
      console.error("Backend session check failed:", error);
      setUser(null);
      setUserData(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme =
      savedTheme === "light" || savedTheme === "dark" ? savedTheme : "light";

    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    clearLegacyClientAuth();
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null);
      setUserData(null);
      setLoading(false);
    };

    window.addEventListener("vitality:session-expired", handleExpiredSession);
    return () =>
      window.removeEventListener(
        "vitality:session-expired",
        handleExpiredSession,
      );
  }, []);

  return (
    <AppContext.Provider value={{ user, loading, userData, refreshSession }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook عشان تستخدمه بسهولة في أي صفحة
export const useApp = () => useContext(AppContext);
