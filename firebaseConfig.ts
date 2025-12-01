import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC1EIL_TvgoBWXpgY0WO-nYH-w_8tP-jZI",
  authDomain: "crmx-3d02f.firebaseapp.com",
  projectId: "crmx-3d02f",
  storageBucket: "crmx-3d02f.firebasestorage.app",
  messagingSenderId: "994294011288",
  appId: "1:994294011288:web:ea141d34ee3be262f747ed",
  measurementId: "G-TET6YT1RGG"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);