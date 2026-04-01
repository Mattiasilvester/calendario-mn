import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyATJE7Nm2r5ikFRcRnkb4E44cwto8imEQw",
  authDomain: "calendario-mn-953a9.firebaseapp.com",
  projectId: "calendario-mn-953a9",
  appId: "1:534109228503:web:00ace9c6178a5fed7c0f92",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
