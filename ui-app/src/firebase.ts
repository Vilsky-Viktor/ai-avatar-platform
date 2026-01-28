import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA954z7Q7oeAq4jLh9nSpw4H3SOXbhFiTA",
  authDomain: "loom24-mvp.firebaseapp.com",
  projectId: "loom24-mvp",
  storageBucket: "loom24-mvp.firebasestorage.app",
  messagingSenderId: "122333756015",
  appId: "1:122333756015:web:a62af8a58c5d5f2a382b9a",
  measurementId: "G-QLWH3VW8DM"
};

// Prevent multiple initializations during Hot Module Replacement (HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export the specific service instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;