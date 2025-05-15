import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;
window.allItems = [];
window.cart = [];
let currentSectionFilter = 'all';

const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

document.addEventListener('DOMContentLoaded', () => {
  // Hide modals initially
  document.getElementById('auth-modal').classList.add('hidden');
  document.getElementById('payment-modal').classList.add('hidden');

  // Modal close buttons
  document.getElementById('close-auth').onclick = () => document.getElementById('auth-modal').classList.add('hidden');
  document.getElementById('close-payment').onclick = () => document.getElementById('payment-modal').classList.add('hidden');

  // Auth actions
  document.getElementById('btnLogin').onclick = loginUser;
  document.getElementById('btnRegister').onclick = registerUser;
  document.getElementById('btnForgot').onclick = resetPassword;

  // Payment
  document.getElementById('ricarica').onclick = () => document.getElementById('payment-modal').classList.remove('hidden');
  document.getElementById('confirmPayment').onclick = () => {
    if (!requireAuth()) return;
    const amt = parseFloat(document.getElementById('paymentAmount').value) || 0;
    changeCredits(amt);
    document.getElementById('payment-modal').classList.add('hidden');
  };

  // Section buttons
  document.getElementById('btnAll').onclick = () => { currentSectionFilter = 'all'; applyFilters(); };
  document.getElementById('btnLeads').onclick = () => { currentSectionFilter = 'lead'; applyFilters(); };
  document.getElementById('btnAppuntamenti').onclick = () => { currentSectionFilter = 'appunt'; applyFilters(); };
  document.getElementById('btnContratti').onclick = () => { currentSectionFilter = 'contr'; applyFilters(); };
  document.getElementById('btnReset').onclick = () => {
    ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id => document.getElementById(id).value = 'Tutti');
    applyFilters();
  };

  // Fetch data
  fetch(sheetURL)
    .then(res => res.text())
    .then(tsv => {
      tsv.trim().split('\n').slice(1).forEach(line => {
        const [regione,citta,categoria,tipo,descrizione,telefono,budget,costo] = line.split('\t');
        window.allItems.push({ regione, citta, categoria, tipo, descrizione, telefono, budget: parseFloat(budget.replace(/[^0-9\.]/g,''))||0, costo: parseFloat(costo.replace(/[^0-9\.]/g,''))||0 });
      });
      populateFilters();
      ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id => document.getElementById(id).onchange = applyFilters);
      applyFilters();
      renderCart();
    });

  // Auth state listener
  onAuthStateChanged(auth, async user => {
    if (user) {
      if (!user.emailVerified) {
        alert('Verifica l'email prima di accedere.');
        auth.signOut();
        return;
      }
      const snap = await getDoc(doc(db,'users',user.uid));
      window.currentUser = { uid: user.uid, credits: snap.data().credits };
      updateCreditsUI(window.currentUser.credits);
    } else {
      window.currentUser = null;
      updateCreditsUI(0);
    }
  });
});

// Auth functions
async function registerUser() {
  const email = document.getElementById('authEmail').value;
  const pw = document.getElementById('authPassword').value;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pw);
    await setDoc(doc(db,'users',cred.user.uid),{email,credits:0,createdAt:Date.now()});
    await sendEmailVerification(cred.user);
    alert('Registrazione avvenuta. Controlla l'email per verificare.');
    document.getElementById('auth-modal').classList.add('hidden');
  } catch (e) { alert('Errore registrazione: '+e.message); }
}

async function loginUser() {
  const email = document.getElementById('authEmail').value;
  const pw = document.getElementById('authPassword').value;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pw);
    if (!cred.user.emailVerified) throw new Error('Email non verificata');
    document.getElementById('auth-modal').classList.add('hidden');
  } catch (e) { alert('Errore login: '+e.message); }
}

function resetPassword() {
  const email = document.getElementById('authEmail').value;
  sendPasswordResetEmail(auth,email).then(()=>alert('Email reset inviata')).catch(e=>alert(e.message));
}

// Utils
function requireAuth() {
  if (!window.currentUser) {
    document.getElementById('auth-modal').classList.remove('hidden');
    return false;
  }
  return true;
}

async function changeCredits(delta) {
  if (!window.currentUser) return;
  const ref = doc(db,'users',window.currentUser.uid);
  const newc = window.currentUser.credits + delta;
  await updateDoc(ref,{credits:newc});
  window.currentUser.credits = newc;
  updateCreditsUI(newc);
}

function updateCreditsUI(val) {
  document.getElementById('currentCredits').textContent = val;
  document.getElementById('currentCreditsEuro').textContent = val.toFixed(2);
}

// Filter and render functions...
function populateFilters() {
  const sets = {
    regioneSelect: [...new Set(window.allItems.map(i=>i.regione))],
    cittaSelect: [...new Set(window.allItems.map(i=>i.citta))],
    categoriaSelect: [...new Set(window.allItems.map(i=>i.categoria))],
    tipoSelect: [...new Set(window.allItems.map(i=>i.tipo))]
  };
  Object.keys(sets).forEach(id => {
    document.getElementById(id).innerHTML = ['Tutti',...sets[id]].map(v=>`<option>${v}</option>`).join('');
  });
}

function applyFilters() {
  const r=document.getElementById('regioneSelect').value;
  const c=document.getElementById('cittaSelect').value;
  const k=document.getElementById('categoriaSelect').value;
  const t=document.getElementById('tipoSelect').value;
  const arr = window.allItems.filter(i=>{
    if(currentSectionFilter!=='all' && !i.tipo.toLowerCase().includes(currentSectionFilter)) return false;
    if(r!=='Tutti' && i.regione!==r) return false;
    if(c!=='Tutti' && i.citta!==c) return false;
    if(k!=='Tutti' && i.categoria!==k) return false;
    if(t!=='Tutti' && i.tipo!==t) return false;
    return true;
  });
  renderCards(arr);
}

function renderCards(arr) {
  const cont=document.getElementById('cards-container');
  cont.innerHTML='';
  arr.forEach(item=>cont.appendChild(createCard(item)));
}

function createCard(item) {
  const cls=item.tipo.toLowerCase().includes('lead')?'lead':item.tipo.toLowerCase().includes('appunt')?'appunt':'contr';
  const card=document.createElement('div');
  card.className=`cliente-card ${cls}`;
  card.innerHTML=`<h3>${item.citta} – ${item.categoria}</h3>
    <p>${item.regione} | ${item.tipo}</p><p>${item.descrizione}</p>
    <p>Budget: €${item.budget.toFixed(2)}</p>
    <p class="telefono hidden">Tel: ${item.telefono}</p><p>Costo crediti: ${item.costo}</p>`;
  const btnAct=document.createElement('button');
  btnAct.className=cls; btnAct.textContent=cls==='lead'?'Acquisisci':cls==='appunt'?'Conferma':'Contratto';
  btnAct.onclick=()=>{ if(!requireAuth()) return; if(item.costo>window.currentUser.credits){ document.getElementById('payment-modal').classList.remove('hidden'); return;} window.cart.push(item); changeCredits(-item.costo); card.querySelector('.telefono').classList.remove('hidden'); renderCart(); };
  const btnCancel=document.createElement('button');
  btnCancel.className='cancel'; btnCancel.textContent='Annulla';
  btnCancel.onclick=()=>{ const idx=window.cart.indexOf(item); if(idx>-1){ window.cart.splice(idx,1); changeCredits(item.costo); card.querySelector('.telefono').classList.add('hidden'); renderCart(); }};
  card.append(btnAct, btnCancel);
  return card;
}

function renderCart(){ document.getElementById('cart').innerHTML=`<h2>Carrello</h2><p>Totale crediti: ${window.cart.reduce((s,i)=>s+i.costo,0)}</p>`;}