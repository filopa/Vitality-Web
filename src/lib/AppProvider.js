"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { get, onValue, ref } from "firebase/database";
import {
  auth,

  ensureFirebaseAuthPersistence,

  rtdb,
} from "./firebase";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [followers, setFollowers] = useState({});
  const [following, setFollowing] = useState({});

  const refreshUserData = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUserData(null);
      setFollowers({});
      setFollowing({});
      return false;
    }

    try {
      await currentUser.getIdToken();
      const snapshot = await get(ref(rtdb, `users/${currentUser.uid}`));
      if (auth.currentUser?.uid !== currentUser.uid) return false;
      setProfileError(null);
      if (!snapshot.exists()) {
        setUserData(null);
        return false;
      }

      setUserData({ ...snapshot.val(), uid: currentUser.uid });
      return true;
    } catch (error) {
      console.error("Firebase user profile refresh failed:", error);
      setProfileError(error.message || "Firebase user profile refresh failed.");
      return false;
    }
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const initialTheme =
      savedTheme === "light" || savedTheme === "dark" ? savedTheme : "light";
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribeAuth = () => {};
    let unsubscribeUser = () => {};
    let unsubscribeFollowers = () => {};
    let unsubscribeFollowing = () => {};

    ensureFirebaseAuthPersistence()
      .then(() => {
        if (!active) return;

        unsubscribeAuth = onAuthStateChanged(
          auth,
          (firebaseUser) => {
            unsubscribeUser();
            unsubscribeFollowers();
            unsubscribeFollowing();
            unsubscribeUser = () => {};
            unsubscribeFollowers = () => {};
            unsubscribeFollowing = () => {};

            setUser(firebaseUser);
            setUserData(null);
            setProfileError(null);
            setFollowers({});
            setFollowing({});
            setLoading(Boolean(firebaseUser));

            if (!firebaseUser) {
              setLoading(false);
              return;
            }

            unsubscribeUser = onValue(
              ref(rtdb, `users/${firebaseUser.uid}`),
              (snapshot) => {
                if (!active || auth.currentUser?.uid !== firebaseUser.uid) return;
                setProfileError(null);
                setUserData(
                  snapshot.exists()
                    ? { ...snapshot.val(), uid: firebaseUser.uid }
                    : null,
                );
                setLoading(false);
              },
              (error) => {
                console.error("Firebase user profile subscription failed:", error);
                if (active && auth.currentUser?.uid === firebaseUser.uid) {
                  setProfileError(
                    error.message || "Firebase user profile subscription failed.",
                  );
                  setLoading(false);
                }
              },
            );


  
          },
          (error) => {
            console.error("Firebase Auth state subscription failed:", error);
            if (active) setLoading(false);
          },
        );
      })
      .catch((error) => {
        console.error("Firebase Auth persistence initialization failed:", error);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsubscribeAuth();
      unsubscribeUser();
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }, []);

  useEffect(() => {
    const handleRejectedToken = () => {
      if (auth.currentUser) {
        signOut(auth).catch((error) => {
          console.error("Could not clear rejected Firebase Auth state:", error);
        });
      }
    };

    window.addEventListener("vitality:auth-token-rejected", handleRejectedToken);
    return () =>
      window.removeEventListener(
        "vitality:auth-token-rejected",
        handleRejectedToken,
      );
  }, []);



  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        userData,
        profileError,
        followers,
        following,
        refreshUserData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
