import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

window.allItems = [];
window.cart = [];

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
  document.getElementById('btnContratti').addEventListener('click', () => filterBySection('contr'));

  fetch(sheetURL)
    .then(r => r.text())
    .then(tsv => {
      const rows = tsv.trim().split('\n').map(r => r.split('\t'));
      rows.shift();
      rows.forEach(cols => {
        const [regione, citta, categoria, tipo, descrizione, telefono, budgetStr, costoStr] = cols;
        const budget = parseFloat(budgetStr.replace(/[^0-9\.,]/g,'')) || 0;
        const costo = parseFloat(costoStr.replace(/[^0-9\.,]/g,'')) || 0;
        window.allItems.push({ regione, citta, categoria, tipo, descrizione, telefono, budget, costo });
      });
      renderCards(window.allItems);
      renderCart();
    });

  onAuthStateChanged(window.firebaseAuth, user => {
    if (user && user.emailVerified) {
      getDoc(doc(window.firebaseDB, 'users', user.uid)).then(snap => {
        const data = snap.data();
        window.currentUser = { uid: user.uid, credits: data.credits };
        document.getElementById('currentCredits').textContent = data.credits;
        document.getElementById('currentCreditsEuro').textContent = data.credits.toFixed(2);
      });
    } else {
      window.currentUser = null;
      document.getElementById('currentCredits').textContent = '0';
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
  const filtered = window.allItems.filter(i => i.tipo.toLowerCase().includes(key));
  renderCards(filtered);
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'cliente-card';
  const btnClass = /lead/.test(item.tipo.toLowerCase()) ? 'lead' : /appunt/.test(item.tipo.toLowerCase()) ? 'appunt' : 'contr';
  card.innerHTML = `
    <h3>${item.citta} – ${item.categoria}</h3>
    <p>${item.regione} | ${item.tipo}</p>
    <p>${item.descrizione}</p>
    <p>Budget: €${item.budget.toFixed(2)}</p>
    <p class="telefono hidden">Telefono: ${item.telefono}</p>
    <p>Costo crediti: ${item.costo}</p>
    <button class="${btnClass}">${btnClass === 'lead' ? 'Acquisisci' : btnClass === 'appunt' ? 'Conferma' : 'Contratto'}</button>
  `;
  const btn = card.querySelector('button');
  btn.addEventListener('click', (e) => handleAction(e, item));
  return card;
}

function handleAction(event, item) {
  const card = event.currentTarget.closest('.cliente-card');
  const tel = card.querySelector('.telefono');
  window.cart.push(item);
  renderCart();
  if (!window.currentUser || item.costo > window.currentUser.credits) {
    alert('Crediti insufficienti, ricarica!');
    document.getElementById('payment-modal').classList.remove('hidden');
  } else {
    changeCredits(-item.costo);
    tel.classList.remove('hidden');
  }
}

function renderCart() {
  const tot = window.cart.reduce((s,i) => s + i.costo, 0);
  document.getElementById('cart').innerHTML = `
    <h2>Carrello</h2>
    <p>Totale crediti: ${tot}</p>
  `;
}

async function changeCredits(delta) {
  if (!window.currentUser) return;
  const ref = doc(window.firebaseDB, 'users', window.currentUser.uid);
  const newVal = window.currentUser.credits + delta;
  await updateDoc(ref, { credits: newVal });
  window.currentUser.credits = newVal;
  document.getElementById('currentCredits').textContent = newVal;
  document.getElementById('currentCreditsEuro').textContent = newVal.toFixed(2);
}
