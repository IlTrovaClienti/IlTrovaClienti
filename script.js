import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const auth = window.firebaseAuth, db = window.firebaseDB;
window.allItems = []; window.cart = []; let currentSectionFilter = 'all';
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('auth-modal').classList.add('hidden');
  document.getElementById('payment-modal').classList.add('hidden');

  fetch(sheetURL).then(r=>r.text()).then(tsv=>{
    tsv.trim().split('\n').slice(1).forEach(line=>{
      const [regione,citta,categoria,tipo,descrizione,telefono,budget,costo] = line.split('\t');
      window.allItems.push({regione,citta,categoria,tipo,descrizione,telefono,budget:+budget.replace(/[^0-9]/g,''),costo:+costo.replace(/[^0-9]/g,'')});
    });
    populateFilters();
    ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id=>{
      document.getElementById(id).onchange = applyFilters;
    });
    applyFilters();
    renderCart();
  });

  document.getElementById('btnAll').onclick = () => { currentSectionFilter='all'; applyFilters(); };
  document.getElementById('btnLeads').onclick = () => { currentSectionFilter='lead'; applyFilters(); };
  document.getElementById('btnAppuntamenti').onclick = () => { currentSectionFilter='appunt'; applyFilters(); };
  document.getElementById('btnContratti').onclick = () => { currentSectionFilter='contr'; applyFilters(); };
  document.getElementById('btnReset').onclick = () => {
    ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id=>document.getElementById(id).value='Tutti');
    applyFilters();
  };
});

function populateFilters() {
  const sets = {
    regioneSelect: [...new Set(window.allItems.map(i=>i.regione))], 
    cittaSelect: [...new Set(window.allItems.map(i=>i.citta))],
    categoriaSelect: [...new Set(window.allItems.map(i=>i.categoria))],
    tipoSelect: [...new Set(window.allItems.map(i=>i.tipo))]
  };
  Object.keys(sets).forEach(id=>{
    const sel = document.getElementById(id);
    sel.innerHTML = ['Tutti', ...sets[id]].map(v=>`<option>${v}</option>`).join('');
  });
}

function applyFilters() {
  const r = document.getElementById('regioneSelect').value, c = document.getElementById('cittaSelect').value;
  const k = document.getElementById('categoriaSelect').value, t = document.getElementById('tipoSelect').value;
  const arr = window.allItems.filter(i => {
    if (currentSectionFilter!=='all' && !i.tipo.toLowerCase().includes(currentSectionFilter)) return false;
    if (r!=='Tutti' && i.regione!==r) return false; if (c!=='Tutti' && i.citta!==c) return false;
    if (k!=='Tutti' && i.categoria!==k) return false; if (t!=='Tutti' && i.tipo!==t) return false;
    return true;
  });
  renderCards(arr);
}

function renderCards(arr) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  arr.forEach(item => container.appendChild(createCard(item)));
}

function createCard(item) {
  const cls = item.tipo.toLowerCase().includes('lead')?'lead':item.tipo.toLowerCase().includes('appunt')?'appunt':'contr';
  const card = document.createElement('div'); card.className = `cliente-card ${cls}`;
  card.innerHTML = `
    <h3>${item.citta} – ${item.categoria}</h3><p>${item.regione} | ${item.tipo}</p>
    <p>${item.descrizione}</p><p>Budget: €${item.budget.toFixed(2)}</p>
    <p class="telefono hidden">Tel: ${item.telefono}</p><p>Costo crediti: ${item.costo}</p>
  `;
  const actionBtn = document.createElement('button'); actionBtn.className = cls; actionBtn.textContent = cls==='lead'?'Acquisisci':cls==='appunt'?'Conferma':'Contratto';
  actionBtn.onclick = () => {
    if (!window.currentUser) { document.getElementById('auth-modal').classList.remove('hidden'); return; }
    if (item.costo > window.currentUser.credits) { document.getElementById('payment-modal').classList.remove('hidden'); return; }
    window.cart.push(item); changeCredits(-item.costo); card.querySelector('.telefono').classList.remove('hidden'); renderCart();
  };
  const cancelBtn = document.createElement('button'); cancelBtn.className='cancel'; cancelBtn.textContent='Annulla';
  cancelBtn.onclick = () => {
    const idx = window.cart.indexOf(item); if (idx>-1) { window.cart.splice(idx,1); changeCredits(item.costo); card.querySelector('.telefono').classList.add('hidden'); renderCart(); }
  };
  card.append(actionBtn, cancelBtn);
  return card;
}

function renderCart(){ document.getElementById('cart').innerHTML = `<h2>Carrello</h2><p>Totale crediti: ${window.cart.reduce((s,i)=>s+i.costo,0)}</p>`; }

async function changeCredits(delta) {
  if (!window.currentUser) return;
  const ref = doc(db,'users',window.currentUser.uid);
  const newc = window.currentUser.credits + delta;
  await updateDoc(ref,{credits:newc});
  window.currentUser.credits=newc; document.getElementById('currentCredits').textContent=newc; document.getElementById('currentCreditsEuro').textContent=newc.toFixed(2);
}