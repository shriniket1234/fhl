import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCzDlU6Js22vv-40zp272zvcRcjMzYk8K4",
  authDomain: "expense-tracker-698e5.firebaseapp.com",
  projectId: "expense-tracker-698e5",
  storageBucket: "expense-tracker-698e5.appspot.com",
  messagingSenderId: "332934652674",
  appId: "1:332934652674:web:5176964fede4748ae3d81b",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
