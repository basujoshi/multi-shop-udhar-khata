import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7aWQulLTd0If2nvBR2eASQU4RV9yBieE",
  authDomain: "khatapro-d8174.firebaseapp.com",
  databaseURL: "https://khatapro-d8174-default-rtdb.firebaseio.com",
  projectId: "khatapro-d8174",
  storageBucket: "khatapro-d8174.firebasestorage.app",
  messagingSenderId: "202105626588",
  appId: "1:202105626588:web:a76112b27cd30b76343919",
  measurementId: "G-9Y10PHGPL6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);

export const cleanMobile = m =>
  String(m || "").replace(/\D/g, "");
