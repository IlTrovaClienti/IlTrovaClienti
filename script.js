import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
const auth = window.firebaseAuth, db = window.firebaseDB;
window.allItems = []; window.cart = []; let currentSectionFilter = 'all';
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
document.addEventListener('DOMContentLoaded', () => {
  // Hide modals
  document.getElementById('auth-modal').classList.add('hidden');
  document.getElementById('payment-modal').classList.add('hidden');
  // Populate filters
  fetch(sheetURL)
    .then(r => r.text())
    .then(tsv => {
      const lines = tsv.trim().split('\n').slice(1);
      lines.forEach(l => {
        const [regione,citta,categoria,tipo,descrizione,telefono,budget,costo] = l.split('\t');
        window.allItems.push({ regione,citta,categoria,tipo,descrizione,telefono, budget:+budget.replace(/[^0-9]/g,''), costo:+costo.replace(/[^0-9]/g,'') });
      });
      populateFilters();
      ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id => {
        const el = document.getElementById(id);
        el.onchange = applyFilters;
      });
      applyFilters();
    });
  // Section buttons
  document.getElementById('btnAll').onclick = () => currentSectionFilter='all',applyFilters();
  document.getElementById('btnLeads').onclick = () => currentSectionFilter='lead',applyFilters();
  document.getElementById('btnAppuntamenti').onclick = () => currentSectionFilter='appunt',applyFilters();
  document.getElementById('btnContratti').onclick = () => currentSectionFilter='contr',applyFilters();
  document.getElementById('btnReset').onclick = () => {
    ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id => document.getElementById(id).value='Tutti');
    applyFilters();
  };
  onAuthStateChanged(auth, async user => {
    if(user && user.emailVerified) {
      const snap = await getDoc(doc(db,'users',user.uid));
      window.currentUser={uid:user.uid,credits:snap.data().credits};
      document.getElementById('currentCredits').textContent=window.currentUser.credits;document.getElementById('currentCreditsEuro').textContent=window.currentUser.credits.toFixed(2);
    } else {
      window.currentUser=null;
      document.getElementById('currentCredits').textContent='0';document.getElementById('currentCreditsEuro').textContent='0.00';
    }
  });
});
function populateFilters() {
  ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id => {
    const set = new Set(window.allItems.map(i => i[id.replace('Select','')]));
    const sel = document.getElementById(id);
    sel.innerHTML = ['Tutti',...set].map(v => `<option>${v}</option>`).join('');
  });
}
function applyFilters(){
  const r=document.getElementById('regioneSelect').value,c=document.getElementById('cittaSelect').value;
  const k=document.getElementById('categoriaSelect').value,t=document.getElementById('tipoSelect').value;
  const arr = window.allItems.filter(i => (r==='Tutti'||i.regione===r)&&(c==='Tutti'||i.citta===c)
    &&(k==='Tutti'||i.categoria===k)&&(t==='Tutti'||i.tipo===t)
    &&(currentSectionFilter==='all'||i.tipo.toLowerCase().includes(currentSectionFilter)));
  renderCards(arr);
}
function renderCards(arr){
  const cont=document.getElementById('cards-container'); cont.innerHTML='';
  arr.forEach(i=>cont.appendChild(createCard(i)));
}
function createCard(i){
  const cls=i.tipo.toLowerCase().includes('lead')?'lead':i.tipo.toLowerCase().includes('appunt')?'appunt':'contr';
  const card=document.createElement('div'); card.className=`cliente-card ${cls}`;
  card.innerHTML=`<h3>${i.citta} – ${i.categoria}</h3><p>${i.regione} | ${i.tipo}</p>
    <p>${i.descrizione}</p><p>Budget: €${i.budget.toFixed(2)}</p>
    <p class="telefono hidden">Tel: ${i.telefono}</p><p>Costo crediti: ${i.costo}</p>
    <button class="${cls}">${cls==='lead'?'Acquisisci':cls==='appunt'?'Conferma':'Contratto'}</button>`;
  card.querySelector('button').onclick=()=>{if(!window.currentUser){document.getElementById('auth-modal').classList.remove('hidden');return;} 
    if(i.costo>window.currentUser.credits){document.getElementById('payment-modal').classList.remove('hidden');return;} 
    window.cart.push(i); renderCart(); changeCredits(-i.costo); card.querySelector('.telefono').classList.remove('hidden');};
  return card;
}
function renderCart(){document.getElementById('cart').innerHTML=`<h2>Carrello</h2><p>Totale crediti: ${window.cart.reduce((s,i)=>s+i.costo,0)}</p>`;}
async function changeCredits(d){const ref=doc(db,'users',window.currentUser.uid); const n=window.currentUser.credits+d;
  await updateDoc(ref,{credits:n}); window.currentUser.credits=n;document.getElementById('currentCredits').textContent=n;document.getElementById('currentCreditsEuro').textContent=n.toFixed(2);
}