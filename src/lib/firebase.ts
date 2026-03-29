import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { config } from './config';

// Firebase configuration using our config utility
const firebaseConfig = {
    apiKey: config.firebase.apiKey,
    authDomain: config.firebase.authDomain,
    projectId: config.firebase.projectId,
    storageBucket: config.firebase.storageBucket,
    messagingSenderId: config.firebase.messagingSenderId,
    appId: config.firebase.appId,
    measurementId: config.firebase.measurementId,
};
// Diagnostic check for Firebase config (browser only)
if (typeof window !== 'undefined') {
    const key = firebaseConfig.apiKey || 'undefined';
    const truncatedKey = key.length > 8 
        ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` 
        : key;
    console.log(`Firebase Config Diagnostics: API Key [${truncatedKey}], Project [${firebaseConfig.projectId}]`);
    
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('DummyKey')) {
        console.error('Firebase Configuration Error: NEXT_PUBLIC_FIREBASE_API_KEY is missing or using a dummy value. Check your .env.local file or Vercel environment variables.');
    }
}

// Initialize Firebase (safely for SSR)
const app = initializeApp(firebaseConfig);

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const firebaseAuthService = {
    signInWithCustomToken: async (token: string) => {
        try {
            const userCredential = await signInWithCustomToken(auth, token);
            return userCredential.user;
        } catch (error) {
            console.error('Error signing in', error);
            throw error;
        }
    },
    getCurrentUser: () => auth.currentUser,
    signOut: async () => {
        await auth.signOut();
    },
    onAuthStateChanged: (callback: any) => {
        return auth.onAuthStateChanged(callback);
    },
};

export const updateFirebaseAuth = (user: any) => {
    if (user) {
        console.log('Firebase user authenticated:', user.uid);
    } else {
        console.log('Firebase user signed out');
    }
};
