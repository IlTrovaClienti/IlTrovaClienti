import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAbiSZaWGRWTxA5C15TYv3IiuCTyS6WaOA",
  authDomain: "iltrovaclienti-948af.firebaseapp.com",
  projectId: "iltrovaclienti-948af",
  storageBucket: "iltrovaclienti-948af.firebaseapp.com",
  messagingSenderId: "774644367448",
  appId: "1:774644367448:web:87bed07de4f922f959ca2d",
  measurementId: "G-JF12YKNJX6"
};

const app = initializeApp(firebaseConfig);
window.firebaseAuth = getAuth(app);
window.firebaseDB = getFirestore(app);