// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDyIr2fg2uUtJPeHmvTJhePkt6DWti12Vw",
  authDomain: "page-not-found-a7dcb.firebaseapp.com",
  projectId: "page-not-found-a7dcb",
  storageBucket: "page-not-found-a7dcb.firebasestorage.app",
  messagingSenderId: "59141562173",
  appId: "1:59141562173:web:a724b5c22145e2b974ef54"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);