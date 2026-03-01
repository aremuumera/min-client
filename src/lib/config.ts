/**
 * Application configuration
 * Mirrors the original customer-frontend config
 */
const isProduction = process.env.NODE_ENV === "production";

export const config = {
  site: {
    name: "MINMEG",
    description: "B2B Mineral Marketplace",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    themeColor: "#16b364",
    facebook: "#",
    twitter: "#",
    linkedin: "#",
    instagram: "#",
    colorScheme: "light",
    primaryColor: "#16b364",
  },
  api: {
    baseUrl: isProduction
      ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      : "http://172.20.10.2:8081/api",
    timeout: 30000,
  },
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  },
  mapbox: {
    accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  },
} as const;

export type Config = typeof config;
