import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyDFk6Buvs_z2KRzzrZFlF8C1wY4hYV0LoI",
  authDomain: "ziv-clinic.firebaseapp.com",
  projectId: "ziv-clinic",
  storageBucket: "ziv-clinic.firebasestorage.app",
  messagingSenderId: "57019795742",
  appId: "1:57019795742:web:d1a06e05221b096245e10f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);