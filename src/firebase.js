import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXN4O-cJehq8phELyfaoLBRovGZM9inwg",
  authDomain: "bardomike-c902c.firebaseapp.com",
  projectId: "bardomike-c902c",
  storageBucket: "bardomike-c902c.firebasestorage.app",
  messagingSenderId: "718728362789",
  appId: "1:718728362789:web:af4f1c1402f71d999578cc",
  measurementId: "G-6DEF965WBT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);
