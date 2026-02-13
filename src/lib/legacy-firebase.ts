// Import the functions you need from the SDKs you need
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);
const auth = getAuth(app);
// Firebase authentication service
export const firebaseAuthService = {
  /**
   * Sign in to Firebase with custom token from your backend
   */
  signInWithCustomToken: async (token) => {
    try {
      const userCredential = await signInWithCustomToken(auth, token);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in', error);
      throw error;
    }
  },

  /**
   * Get current Firebase user
   */
  getCurrentUser: () => {
    return auth.currentUser;
  },

  /**
   * Sign out from Firebase
   */
  signOut: async () => {
    await auth.signOut();
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged: (callback) => {
    return auth.onAuthStateChanged(callback);
  },
};

// Update Firebase rules
export const updateFirebaseAuth = (user) => {
  if (user) {
    // User is signed in, Firebase operations will work
    console.log('Firebase user authenticated:', user.uid);
  } else {
    console.log('Firebase user signed out');
  }
};

export const db = getFirestore(app);
export { storage, analytics };
