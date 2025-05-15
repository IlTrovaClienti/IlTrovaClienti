import { 
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const auth = window.firebaseAuth;
const db   = window.firebaseDB;

window.allItems = [];
window.cart     = [];

const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ricarica').addEventListener('click', () => {
    document.getElementById('payment-modal').classList.remove('hidden');
  });
  document.getElementById('close-payment').addEventListener('click', () => {
    document.getElementById('payment-modal').classList.add('hidden');
  });
  document.getElementById('confirmPayment').addEventListener('click', () => {
    const amt = parseFloat(document.getElementById('paymentAmount').value) || 0;
    if (amt > 0) changeCredits(amt);
    document.getElementById('payment-modal').classList.add('hidden');
  });

  document.getElementById('btnLeads').addEventListener('click', () => filterBySection('lead'));
  document.getElementById('btnAppuntamenti').addEventListener('click', () => filterBySection('appunt'));
  document.getElementById('btnContratti').addEventListener('click', () => filterBySection('contratto'));

  fetch(sheetURL)
    .then(r => r.text())
    .then(tsv => {
      const rows = tsv.trim().split('\n').map(r => r.split('\t'));
      rows.shift();
      rows.forEach(cols => {
        const [regione, status, citta, budgetStr] = cols;
        const item = {
          regione,
          status,
          citta,
          budget: parseFloat(budgetStr.replace(/[^0-9\.,]/g,'')) || 0
        };
        window.allItems.push(item);
      });
      renderCards(window.allItems);
      renderCart();
    });

  onAuthStateChanged(auth, user => {
    if (user && user.emailVerified) {
      getDoc(doc(db,'users',user.uid)).then(snap => {
        const data = snap.data();
        window.currentUser = { uid:user.uid, credits:data.credits };
        document.getElementById('currentCredits').textContent     = data.credits;
        document.getElementById('currentCreditsEuro').textContent = data.credits.toFixed(2);
      });
    } else {
      window.currentUser = null;
      document.getElementById('currentCredits').textContent     = '0';
      document.getElementById('currentCreditsEuro').textContent = '0.00';
    }
  });
});

function renderCards(list) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  list.forEach(item => container.appendChild(createCard(item)));
}

function filterBySection(key) {
  const filtered = window.allItems.filter(i => i.status.toLowerCase().includes(key));
  renderCards(filtered);
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'cliente-card';
  card.innerHTML = `
    <h3>${item.status} – ${item.citta}</h3>
    <p>${item.regione} | ${item.status}</p>
    <p>Budget: €${item.budget.toFixed(2)}</p>
  `;
  const btn = document.createElement('button');
  const s = item.status.toLowerCase();
  btn.textContent = /lead/.test(s)
    ? 'Acquisisci'
    : /appunt/.test(s)
      ? 'Conferma'
      : 'Contratto';
  btn.addEventListener('click', () => handleAction(item));
  card.appendChild(btn);
  return card;
}

function handleAction(item) {
  window.cart.push(item);
  renderCart();
  if (!window.currentUser || item.budget > window.currentUser.credits) {
    alert('Crediti insufficienti, ricarica!');
    document.getElementById('payment-modal').classList.remove('hidden');
  } else {
    changeCredits(-item.budget);
  }
}

function renderCart() {
  const tot = window.cart.reduce((s,i)=>s+i.budget,0);
  document.getElementById('cart').innerHTML = `
    <h2>Carrello</h2>
    <p>Totale: €${tot.toFixed(2)}</p>
  `;
}

async function changeCredits(delta) {
  if (!window.currentUser) return;
  const ref = doc(db,'users',window.currentUser.uid);
  const newVal = window.currentUser.credits + delta;
  await updateDoc(ref,{ credits:newVal });
  window.currentUser.credits = newVal;
  document.getElementById('currentCredits').textContent     = newVal;
  document.getElementById('currentCreditsEuro').textContent = newVal.toFixed(2);
}
