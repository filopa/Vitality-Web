"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, rtdb } from "./firebase";
import { onValue, ref } from "firebase/database";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const THEME_STORAGE_KEY = "theme";
  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme =
      savedTheme === "light" || savedTheme === "dark" ? savedTheme : "light";

    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    // دي الشغلانة اللي بتشتغل في الخلفية طول ما التطبيق مفتوح
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // التنظيف عند إلغاء المكون
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (user) {
      const userRef = ref(rtdb, `users/${user.uid}`);
      const userData2 = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserData((prevUser) => ({
            ...prevUser,
            ...snapshot.val(),
          }));
        }
      });
      () => {
        userData2();
      };
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ user, loading, userData }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook عشان تستخدمه بسهولة في أي صفحة
export const useApp = () => useContext(AppContext);
