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
  // Remove auto-show of auth modal on load
  const authModal = document.getElementById('auth-modal');
  document.getElementById('close-auth').onclick = () => authModal.classList.add('hidden');

  document.getElementById('btnLogin').onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pw = document.getElementById('authPassword').value;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pw);
      if (!cred.user.emailVerified) {
        await auth.signOut();
        alert('Verifica la tua email prima di accedere.');
      } else {
        authModal.classList.add('hidden');
      }
    } catch (e) { alert('Login error: ' + e.message); }
  };

  document.getElementById('btnRegister').onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pw = document.getElementById('authPassword').value;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      const u = cred.user;
      await setDoc(doc(db, 'users', u.uid), { email: u.email, credits: 0, createdAt: Date.now() });
      await sendEmailVerification(u);
      alert('Registrazione ok! Controlla email per verifica.');
      authModal.classList.add('hidden');
    } catch (e) { alert('Register error: ' + e.message); }
  };

  document.getElementById('btnForgot').onclick = () => {
    const email = document.getElementById('authEmail').value;
    sendPasswordResetEmail(auth, email)
      .then(() => alert('Email di reset inviata'))
      .catch(e => alert('Error: ' + e.message));
  };

  // Payment modal
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

  // Fetch items
  fetch(sheetURL)
    .then(r => r.ok ? r.text() : Promise.reject('Status ' + r.status))
    .then(tsv => {
      tsv.trim().split('\n').slice(1).forEach(line => {
        const [regione, citta, categoria, tipo, descrizione, telefono, budgetStr, costoStr] = line.split('\t');
        window.allItems.push({
          regione,citta,categoria,tipo,descrizione,telefono,
          budget: parseFloat(budgetStr.replace(/[^0-9\.,]/g,''))||0,
          costo: parseFloat(costoStr.replace(/[^0-9\.,]/g,''))||0
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

// Show auth modal only when needed
function requireAuth() {
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    document.getElementById('auth-modal').classList.remove('hidden');
    return false;
  }
  return true;
}

function populateFilters() {
  const regs = ['Tutti', ...new Set(window.allItems.map(i => i.regione))];
  const cits = ['Tutti', ...new Set(window.allItems.map(i => i.citta))];
  const cats = ['Tutti', ...new Set(window.allItems.map(i => i.categoria))];
  const tips = ['Tutti', ...new Set(window.allItems.map(i => i.tipo))];
  document.getElementById('regioneSelect').innerHTML = regs.map(v => `<option value="${v}">${v}</option>`).join('');
  document.getElementById('cittaSelect').innerHTML = cits.map(v => `<option value="${v}">${v}</option>`).join('');
  document.getElementById('categoriaSelect').innerHTML = cats.map(v => `<option value="${v}">${v}</option>`).join('');
  document.getElementById('tipoSelect').innerHTML = tips.map(v => `<option value="${v}">${v}</option>`).join('');
}

function filterBySection(key) {
  currentSectionFilter = key;
  applyFilters();
}

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

function renderCards(items) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  items.forEach(item => {
    const card = createCard(item);
    container.appendChild(card);
  });
}

function createCard(item) {
  const card = document.createElement('div');
  const cls = item.tipo.toLowerCase().includes('lead') ? 'lead' :
              item.tipo.toLowerCase().includes('appunt') ? 'appunt' : 'contr';
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
  card.querySelector('button').onclick = () => {
    if (!requireAuth()) return;
    handleAction(item, card);
  };
  return card;
}

function handleAction(item, card) {
  const tel = card.querySelector('.telefono');
  if (item.costo > window.currentUser.credits) {
    document.getElementById('payment-modal').classList.remove('hidden');
    return;
  }
  window.cart.push(item);
  renderCart();
  changeCredits(-item.costo);
  tel.classList.remove('hidden');
}

function renderCart() {
  const total = window.cart.reduce((s, it) => s + it.costo, 0);
  document.getElementById('cart').innerHTML = `<h2>Carrello</h2><p>Totale crediti: ${total}</p>`;
}

async function changeCredits(delta) {
  if (!window.currentUser) return;
  const ref = doc(db, 'users', window.currentUser.uid);
  const newVal = window.currentUser.credits + delta;
  await updateDoc(ref, { credits: newVal });
  window.currentUser.credits = newVal;
  document.getElementById('currentCredits').textContent = newVal;
  document.getElementById('currentCreditsEuro').textContent = newVal.toFixed(2);
}

// Auth state update window.currentUser
onAuthStateChanged(auth, async user => {
  if (user && user.emailVerified) {
    const snap = await getDoc(doc(db, 'users', user.uid));
    window.currentUser = { uid: user.uid, credits: snap.data().credits };
  } else {
    window.currentUser = null;
  }
});