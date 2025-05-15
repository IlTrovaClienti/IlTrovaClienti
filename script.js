import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
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
  // –– Modali Auth
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
      alert('Registrazione ok! Controlla la tua email per verificare l’account.');
      authModal.classList.add('hidden');
    } catch (e) { alert('Register error: ' + e.message); }
  };
  document.getElementById('btnForgot').onclick = () => {
    const email = document.getElementById('authEmail').value;
    sendPasswordResetEmail(auth, email)
      .then(() => alert('Email di reset inviata'))
      .catch(err => alert(err.message));
  };

  // –– Modali Pagamento
  const paymentModal = document.getElementById('payment-modal');
  document.getElementById('ricarica').onclick = () => paymentModal.classList.remove('hidden');
  document.getElementById('close-payment').onclick = () => paymentModal.classList.add('hidden');
  paymentModal.onclick = e => { if (e.target === paymentModal) paymentModal.classList.add('hidden'); };
  document.getElementById('confirmPayment').onclick = () => {
    const amt = parseFloat(document.getElementById('paymentAmount').value) || 0;
    changeCredits(amt);
    paymentModal.classList.add('hidden');
  };

  // –– Sezioni
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

  // –– Fetch e parsing corretto del TSV
  fetch(sheetURL)
    .then(res => res.ok ? res.text() : Promise.reject('HTTP ' + res.status))
    .then(tsv => {
      const lines = tsv.trim().split('\\n');
      lines.shift(); // togli header
      lines.forEach(line => {
        const cols = line.split('\\t');
        const [regione, citta, categoria, tipo, descrizione, telefono, budgetStr, costoStr] = cols;
        window.allItems.push({
          regione: regione,
          citta: citta,
          categoria: categoria,
          tipo: tipo,
          descrizione: descrizione,
          telefono: telefono,
          budget: parseFloat(budgetStr.replace(/[^0-9\\.,]/g,'')) || 0,
          costo: parseFloat(costoStr.replace(/[^0-9\\.,]/g,'')) || 0
        });
      });
      populateFilters();
      ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect']
        .forEach(id => document.getElementById(id).onchange = applyFilters);
      applyFilters();
      renderCart();
    })
    .catch(err => alert('Errore caricamento dati: ' + err));

  // –– Stato Auth
  onAuthStateChanged(auth, async user => {
    if (user && user.emailVerified) {
      const snap = await getDoc(doc(db,'users',user.uid));
      window.currentUser = { uid: user.uid, credits: snap.data().credits };
      document.getElementById('currentCredits').textContent = window.currentUser.credits;
      document.getElementById('currentCreditsEuro').textContent = window.currentUser.credits.toFixed(2);
    } else {
      window.currentUser = null;
      document.getElementById('currentCredits').textContent = '0';
      document.getElementById('currentCreditsEuro').textContent = '0.00';
    }
  });
});

// –– Helpers

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
  document.getElementById('regioneSelect').innerHTML = regs.map(v => `<option>${v}</option>`).join('');
  document.getElementById('cittaSelect').innerHTML   = cits.map(v => `<option>${v}</option>`).join('');
  document.getElementById('categoriaSelect').innerHTML = cats.map(v => `<option>${v}</option>`).join('');
  document.getElementById('tipoSelect').innerHTML     = tips.map(v => `<option>${v}</option>`).join('');
}

function filterBySection(key) {
  currentSectionFilter = key;
  applyFilters();
}

function applyFilters() {
  const r = document.getElementById('regioneSelect').value;
  const c = document.getElementById('cittaSelect').value;
  const k = document.getElementById('categoriaSelect').value;
  const t = document.getElementById('tipoSelect').value;
  const list = window.allItems.filter(i => {
    if (currentSectionFilter !== 'all' && !i.tipo.toLowerCase().includes(currentSectionFilter)) return false;
    if (r !== 'Tutti' && i.regione !== r) return false;
    if (c !== 'Tutti' && i.citta !== c) return false;
    if (k !== 'Tutti' && i.categoria !== k) return false;
    if (t !== 'Tutti' && i.tipo !== t) return false;
    return true;
  });
  renderCards(list);
}

function renderCards(arr) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  arr.forEach(item => container.appendChild(createCard(item)));
}

function createCard(item) {
  const card = document.createElement('div');
  const cls = item.tipo.toLowerCase().includes('lead')
    ? 'lead'
    : item.tipo.toLowerCase().includes('appunt')
      ? 'appunt'
      : 'contr';
  card.className = `cliente-card ${cls}`;
  card.innerHTML = `
    <h3>${item.citta} – ${item.categoria}</h3>
    <p>${item.regione} | ${item.tipo}</p>
    <p>${item.descrizione}</p>
    <p>Budget: €${item.budget.toFixed(2)}</p>
    <p class="telefono hidden">Tel: ${item.telefono}</p>
    <p>Costo crediti: ${item.costo}</p>
    <button class="${cls}">
      ${cls==='lead'?'Acquisisci':cls==='appunt'?'Conferma':'Contratto'}
    </button>`;
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
  const tot = window.cart.reduce((s,i) => s+i.costo, 0);
  document.getElementById('cart').innerHTML = `<h2>Carrello</h2><p>Totale crediti: ${tot}</p>`;
}

async function changeCredits(delta) {
  if (!window.currentUser) return;
  const ref = doc(db,'users',window.currentUser.uid);
  const newc = window.currentUser.credits + delta;
  await updateDoc(ref,{credits:newc});
  window.currentUser.credits=newc;
  document.getElementById('currentCredits').textContent = newc;
  document.getElementById('currentCreditsEuro').textContent = newc.toFixed(2);
}
