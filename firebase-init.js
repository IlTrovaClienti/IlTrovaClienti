import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
const firebaseConfig = {/* your config */};
const app = initializeApp(firebaseConfig);
window.firebaseAuth = getAuth(app);
window.firebaseDB = getFirestore(app);