import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Prevent re-initializing on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth with AsyncStorage persistence — keeps users logged in across restarts
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app); // Web handles persistence automatically via IndexedDB
} else {
  try {
    const { getReactNativePersistence } = require('firebase/auth');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
}

let db;
if (getApps().length === 1) {
  if (Platform.OS === 'web') {
    db = getFirestore(app);
  } else {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  }
} else {
  db = getFirestore(app);
}
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { app, auth, db, rtdb, storage };
