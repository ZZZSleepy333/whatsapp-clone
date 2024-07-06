import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDBHqpaCKMn5hy6uuJqEhyGKakpWdWpUfc",
  authDomain: "whatappsclone-635ca.firebaseapp.com",
  projectId: "whatappsclone-635ca",
  storageBucket: "whatappsclone-635ca.appspot.com",
  messagingSenderId: "578676297810",
  appId: "1:578676297810:web:1bc4d477b1c16423390f8b",
  measurementId: "G-EHM16SHS0D",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { db, auth, provider };
