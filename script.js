// Import Firebase modules
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;

// Stato globale
window.cart = [];

// Example: funzioni per fetch dei dati e creazione card
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

document.addEventListener('DOMContentLoaded', () => {
  // Handler Ricarica
  document.getElementById('ricarica').addEventListener('click', () => {
    // Apri modale pagamento
    document.getElementById('payment-modal').style.display = 'block';
  });

  // Carica dati e popola card
  fetch(sheetURL)
    .then(res => res.text())
    .then(tsv => {
      const rows = tsv.trim().split('\n').map(r => r.split('\t'));
      // Rimuovi header
      rows.shift();
      rows.forEach(cols => {
        const [regione, status, citta, budget] = cols;
        const item = { regione, status, citta, budget: parseFloat(budget.replace('€','') || 0) };
        const card = createCard(item);
        document.getElementById('cards-container').appendChild(card);
      });
      renderCart();
    });
});

// Crea una singola card cliente con pulsante azione
function createCard(item) {
  const card = document.createElement('div');
  card.classList.add('cliente-card');
  card.innerHTML = \`
    <h3>\${item.status} – \${item.citta}</h3>
    <p>\${item.regione} | \${item.status}</p>
    <p>Budget: €\${item.budget}</p>
  \`;
  // Pulsante di azione
  const actionBtn = document.createElement('button');
  actionBtn.classList.add('btn-action');
  actionBtn.textContent = item.status === 'Lead da chiamare'
    ? 'Acquisisci'
    : item.status === 'Appuntamento fissato'
      ? 'Conferma'
      : 'Contratto';
  actionBtn.addEventListener('click', () => handleAction(item));
  card.appendChild(actionBtn);
  return card;
}

// Azione su clic pulsante
function handleAction(item) {
  console.log('Azione su:', item.status);
  // Aggiungi al carrello e sottrai crediti
  addToCart(item);
  if (item.budget > window.currentUser?.credits) {
    alert('Crediti insufficienti, ricarica!');
    document.getElementById('payment-modal').style.display = 'block';
  } else {
    changeCredits(-item.budget);
  }
}

// Gestione carrello
function addToCart(item) {
  window.cart.push(item);
  renderCart();
}

function renderCart() {
  const total = window.cart.reduce((sum,i)=>sum+i.budget,0);
  document.getElementById('cart').innerHTML = \`
    <h2>Carrello</h2>
    <p>Totale: €\${total.toFixed(2)}</p>
  \`;
}

// Auth/Firestore: registrazione, login, crediti
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
      document.getElementById('currentCredits').textContent = data.credits;
      document.getElementById('currentCreditsEuro').textContent = data.credits.toFixed(2);
    }
  } catch (err) {
    console.error(err);
    alert("Errore login: " + err.message);
  }
}

onAuthStateChanged(auth, user => {
  if (user && user.emailVerified) {
    getDoc(doc(db, "users", user.uid)).then(snap => {
      const data = snap.data();
      window.currentUser = { uid: user.uid, email: user.email, credits: data.credits };
      document.getElementById('currentCredits').textContent = data.credits;
      document.getElementById('currentCreditsEuro').textContent = data.credits.toFixed(2);
    });
  } else {
    window.currentUser = null;
    document.getElementById('currentCredits').textContent = '0';
    document.getElementById('currentCreditsEuro').textContent = '0.00';
  }
});

export async function changeCredits(delta) {
  if (!window.currentUser) return;
  const uid = window.currentUser.uid;
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    credits: window.currentUser.credits + delta
  });
  window.currentUser.credits += delta;
  document.getElementById('currentCredits').textContent = window.currentUser.credits;
  document.getElementById('currentCreditsEuro').textContent = window.currentUser.credits.toFixed(2);
}
