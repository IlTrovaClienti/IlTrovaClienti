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
  // Auth modal
  const authModal = document.getElementById('auth-modal');
  document.getElementById('close-auth').onclick = () => authModal.classList.add('hidden');
  onAuthStateChanged(auth, user => {
    if (!user) authModal.classList.remove('hidden');
  });
  document.getElementById('btnLogin').onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pw = document.getElementById('authPassword').value;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pw);
      if (!cred.user.emailVerified) {
        await auth.signOut();
        alert('Verifica la tua email.');
      } else authModal.classList.add('hidden');
    } catch(e) { alert('Login error: ' + e.message); }
  };
  document.getElementById('btnRegister').onclick = async () => {
    const email = document.getElementById('authEmail').value;
    const pw = document.getElementById('authPassword').value;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      const u = cred.user;
      await setDoc(doc(db,'users',u.uid), { email: u.email, credits:0, createdAt:Date.now() });
      await sendEmailVerification(u);
      alert('Registrazione ok! Controlla email.');
    } catch(e) { alert('Register error: ' + e.message); }
  };
  document.getElementById('btnForgot').onclick = () => {
    const email = document.getElementById('authEmail').value;
    sendPasswordResetEmail(auth,email)
      .then(() => alert('Email reset inviata'))
      .catch(e => alert('Error: ' + e.message));
  };

  // Payment modal
  const paymentModal = document.getElementById('payment-modal');
  document.getElementById('ricarica').onclick = () => paymentModal.classList.remove('hidden');
  document.getElementById('close-payment').onclick = () => paymentModal.classList.add('hidden');
  paymentModal.onclick = e => { if (e.target===paymentModal) paymentModal.classList.add('hidden'); };
  document.getElementById('confirmPayment').onclick = () => {
    const amt = parseFloat(document.getElementById('paymentAmount').value)||0;
    changeCredits(amt);
    paymentModal.classList.add('hidden');
  };

  // Section filter buttons
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

  // Fetch data
  fetch(sheetURL).then(r=>r.ok?r.text():Promise.reject(r.status)).then(tsv=>{
    tsv.trim().split('\n').slice(1).forEach(line => {
      const [regione,citta,categoria,tipo,descrizione,telefono,budgetStr,costoStr] = line.split('\t');
      window.allItems.push({
        regione,citta,categoria,tipo,descrizione,telefono,
        budget:parseFloat(budgetStr.replace(/[^0-9\.,]/g,''))||0,
        costo:parseFloat(costoStr.replace(/[^0-9\.,]/g,''))||0
      });
    });
    populateFilters();
    ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id => {
      document.getElementById(id).onchange = applyFilters;
    });
    applyFilters();
    renderCart();
  }).catch(e=>alert('Errore dati: '+e));

  // Update credits display on auth state change
  onAuthStateChanged(auth, async user => {
    if(user && user.emailVerified) {
      const snap = await getDoc(doc(db,'users',user.uid));
      const data = snap.data();
      document.getElementById('currentCredits').textContent = data.credits;
      document.getElementById('currentCreditsEuro').textContent = data.credits.toFixed(2);
    }
  });
});

function populateFilters() {
  [['regioneSelect', window.allItems.map(i=>i.regione)],
   ['cittaSelect', window.allItems.map(i=>i.citta)],
   ['categoriaSelect', window.allItems.map(i=>i.categoria)],
   ['tipoSelect', window.allItems.map(i=>i.tipo)]]
    .forEach(([id, vals]) => {
      const sel = document.getElementById(id);
      const opts = ['Tutti', ...new Set(vals)];
      sel.innerHTML = opts.map(v=>`<option value="\${v}">\${v}</option>`).join('');
    });
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
    if(currentSectionFilter!=='all' && !i.tipo.toLowerCase().includes(currentSectionFilter)) return false;
    if(r!=='Tutti' && i.regione!==r) return false;
    if(c!=='Tutti' && i.citta!==c) return false;
    if(k!=='Tutti' && i.categoria!==k) return false;
    if(t!=='Tutti' && i.tipo!==t) return false;
    return true;
  });
  renderCards(list);
}

function renderCards(list) {
  const cont = document.getElementById('cards-container');
  cont.innerHTML = '';
  list.forEach(item => cont.appendChild(createCard(item)));
}

function createCard(item) {
  const card = document.createElement('div');
  const typ = item.tipo.toLowerCase();
  const cls = typ.includes('lead') ? 'lead' : typ.includes('appunt') ? 'appunt' : 'contr';
  card.className = `cliente-card ${cls}`;
  card.innerHTML = `
    <h3>${item.citta} – ${item.categoria}</h3>
    <p>${item.regione} | ${item.tipo}</p>
    <p>${item.descrizione}</p>
    <p>Budget: €${item.budget.toFixed(2)}</p>
    <p class="telefono hidden">Tel: ${item.telefono}</p>
    <p>Costo crediti: ${item.costo}</p>
    <button>${cls==='lead'?'Acquisisci':cls==='appunt'?'Conferma':'Contratto'}</button>
  `;
  card.querySelector('button').onclick = () => handleAction(item, card);
  return card;
}

function handleAction(item, card) {
  const telP = card.querySelector('.telefono');
  if(!window.currentUser || item.costo > window.currentUser.credits) {
    return alert('Crediti insufficienti');
  }
  window.cart.push(item);
  renderCart();
  changeCredits(-item.costo);
  telP.classList.remove('hidden');
}

function renderCart() {
  const sum = window.cart.reduce((a,i)=>a+i.costo,0);
  document.getElementById('cart').innerHTML = `<h2>Carrello</h2><p>Totale crediti: ${sum}</p>`;
}

async function changeCredits(delta) {
  if(!window.currentUser) return;
  const ref = doc(db,'users',window.currentUser.uid);
  const newVal = window.currentUser.credits + delta;
  await updateDoc(ref,{credits:newVal});
  window.currentUser.credits = newVal;
  document.getElementById('currentCredits').textContent = newVal;
  document.getElementById('currentCreditsEuro').textContent = newVal.toFixed(2);
}