import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;

window.allItems = [];
window.cart = [];
let currentSectionFilter = 'all';

const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

document.addEventListener('DOMContentLoaded', () => {
  // Authentication modal handlers (login/register/password reset)
  const authModal = document.getElementById('auth-modal');
  document.getElementById('close-auth').onclick = () => authModal.classList.add('hidden');
  onAuthStateChanged(auth, user => {
    if (!user) authModal.classList.remove('hidden');
  });
  document.getElementById('btnLogin').onclick = async () => { /* login code as before */ };
  document.getElementById('btnRegister').onclick = async () => { /* register code as before */ };
  document.getElementById('btnForgot').onclick = () => { /* forgot code as before */ };

  // Payment modal handlers
  const paymentModal = document.getElementById('payment-modal');
  document.getElementById('ricarica').onclick = () => paymentModal.classList.remove('hidden');
  document.getElementById('close-payment').onclick = () => paymentModal.classList.add('hidden');
  paymentModal.onclick = e => { if (e.target === paymentModal) paymentModal.classList.add('hidden'); };
  document.getElementById('confirmPayment').onclick = () => {
    const amt = parseFloat(document.getElementById('paymentAmount').value) || 0;
    changeCredits(amt);
    paymentModal.classList.add('hidden');
  };

  // Section buttons
  document.getElementById('btnAll').onclick = () => filterBySection('all');
  document.getElementById('btnLeads').onclick = () => filterBySection('lead');
  document.getElementById('btnAppuntamenti').onclick = () => filterBySection('appunt');
  document.getElementById('btnContratti').onclick = () => filterBySection('contr');
  document.getElementById('btnReset').onclick = () => {
    currentSectionFilter = 'all';
    ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id => {
      document.getElementById(id).value = 'Tutti';
    });
    applyFilters();
  };

  // Fetch data and populate filters/cards
  fetch(sheetURL)
    .then(response => response.ok ? response.text() : Promise.reject('Status ' + response.status))
    .then(tsv => {
      const rows = tsv.trim().split('\n').slice(1).map(r => r.split('\t'));
      rows.forEach(cols => {
        const [regione, citta, categoria, tipo, descrizione, telefono, budgetStr, costoStr] = cols;
        window.allItems.push({
          regione, citta, categoria, tipo, descrizione, telefono,
          budget: parseFloat(budgetStr.replace(/[^0-9\.,]/g, '')) || 0,
          costo: parseFloat(costoStr.replace(/[^0-9\.,]/g, '')) || 0
        });
      });
      populateFilters();
      ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id => {
        document.getElementById(id).onchange = applyFilters;
      });
      applyFilters();
      renderCart();
    })
    .catch(err => alert('Errore caricamento dati: ' + err));
});

// Populate dropdown filters
function populateFilters() {
  const regs = ['Tutti', ...new Set(window.allItems.map(i => i.regione))];
  const cits = ['Tutti', ...new Set(window.allItems.map(i => i.citta))];
  const cats = ['Tutti', ...new Set(window.allItems.map(i => i.categoria))];
  const tips = ['Tutti', ...new Set(window.allItems.map(i => i.tipo))];

  document.getElementById('regioneSelect').innerHTML = regs.map(v => `<option value="${v}">${v}</option>`).join('');
  document.getElementById('cittaSelect').innerHTML   = cits.map(v => `<option value="${v}">${v}</option>`).join('');
  document.getElementById('categoriaSelect').innerHTML = cats.map(v => `<option value="${v}">${v}</option>`).join('');
  document.getElementById('tipoSelect').innerHTML     = tips.map(v => `<option value="${v}">${v}</option>`).join('');
}

// Section filter
function filterBySection(key) {
  currentSectionFilter = key;
  applyFilters();
}

// Apply filters to items and render cards
function applyFilters() {
  const selReg = document.getElementById('regioneSelect').value;
  const selCit = document.getElementById('cittaSelect').value;
  const selCat = document.getElementById('categoriaSelect').value;
  const selTip = document.getElementById('tipoSelect').value;

  const filtered = window.allItems.filter(item => {
    if (currentSectionFilter !== 'all' && !item.tipo.toLowerCase().includes(currentSectionFilter)) return false;
    if (selReg !== 'Tutti' && item.regione !== selReg) return false;
    if (selCit !== 'Tutti' && item.citta !== selCit) return false;
    if (selCat !== 'Tutti' && item.categoria !== selCat) return false;
    if (selTip !== 'Tutti' && item.tipo !== selTip) return false;
    return true;
  });

  renderCards(filtered);
}

// Render a list of cards
function renderCards(items) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  items.forEach(item => {
    const card = createCard(item);
    container.appendChild(card);
  });
}

// Create a single card element
function createCard(item) {
  const card = document.createElement('div');
  const tipoLower = item.tipo.toLowerCase();
  const cls = tipoLower.includes('lead') ? 'lead' :
              tipoLower.includes('appunt') ? 'appunt' : 'contr';
  card.className = `cliente-card ${cls}`;
  card.innerHTML = `
    <h3>${item.citta} – ${item.categoria}</h3>
    <p>${item.regione} | ${item.tipo}</p>
    <p>${item.descrizione}</p>
    <p>Budget: €${item.budget.toFixed(2)}</p>
    <p class="telefono hidden">Tel: ${item.telefono}</p>
    <p>Costo crediti: ${item.costo}</p>
    <button class="${cls}">${cls==='lead'?'Acquisisci':cls==='appunt'?'Conferma':'Contratto'}</button>
  `;
  card.querySelector('button').onclick = () => handleAction(item, card);
  return card;
}

// Handle acquisition action
function handleAction(item, card) {
  const tel = card.querySelector('.telefono');
  if (!window.currentUser || item.costo > window.currentUser.credits) {
    alert('Crediti insufficienti');
    return;
  }
  window.cart.push(item);
  renderCart();
  changeCredits(-item.costo);
  tel.classList.remove('hidden');
}

// Render cart summary
function renderCart() {
  const total = window.cart.reduce((sum, it) => sum + it.costo, 0);
  document.getElementById('cart').innerHTML = `<h2>Carrello</h2><p>Totale crediti: ${total}</p>`;
}

// Update credits in Firestore and UI
async function changeCredits(delta) {
  if (!window.currentUser) return;
  const ref = doc(db, 'users', window.currentUser.uid);
  const newCredits = window.currentUser.credits + delta;
  await updateDoc(ref, { credits: newCredits });
  window.currentUser.credits = newCredits;
  document.getElementById('currentCredits').textContent = newCredits;
  document.getElementById('currentCreditsEuro').textContent = newCredits.toFixed(2);
}