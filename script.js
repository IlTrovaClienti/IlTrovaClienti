// Import Firebase modules
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;

// Esempio: funzioni esistenti per fetch dei dati e popolazione UI
// --- Inizio codice esistente ---
// fetch(sheetURL)
//   .then(...)
//   .then(data => {
//     // Popola filtri e genera card
//   });
// --- Fine codice esistente ---

// Registrazione utente
export async function register(email, password) {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      credits: 0,
      createdAt: Date.now()
    });
    await sendEmailVerification(user);
    alert("Registrazione ok! Controlla la tua email per verificare l'account.");
  } catch (err) {
    console.error(err);
    alert("Errore registrazione: " + err.message);
  }
}

// Login utente
export async function login(email, password) {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    if (!user.emailVerified) {
      alert("Devi prima verificare la tua email.");
      await auth.signOut();
      return;
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      window.currentUser = { uid: user.uid, email: user.email, credits: data.credits };
      updateUIAfterLogin();
    } else {
      throw new Error("Dati utente non trovati.");
    }
  } catch (err) {
    console.error(err);
    alert("Errore login: " + err.message);
  }
}

// Mantieni sessione attiva
onAuthStateChanged(auth, user => {
  if (user && user.emailVerified) {
    getDoc(doc(db, "users", user.uid)).then(snap => {
      const data = snap.data();
      window.currentUser = { uid: user.uid, email: user.email, credits: data.credits };
      updateUIAfterLogin();
    });
  } else {
    window.currentUser = null;
    updateUIAfterLogout();
  }
});

// Modifica crediti
export async function changeCredits(delta) {
  if (!window.currentUser) return;
  const uid = window.currentUser.uid;
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    credits: window.currentUser.credits + delta
  });
  window.currentUser.credits += delta;
  renderCreditsInUI(window.currentUser.credits);
}
