import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const auth = window.firebaseAuth, db = window.firebaseDB;
window.allItems = []; window.cart = []; let currentSectionFilter = 'all';
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

document.addEventListener('DOMContentLoaded', () => {
  const authModal = document.getElementById('auth-modal'), paymentModal = document.getElementById('payment-modal');
  ['close-auth','close-payment'].forEach(id => document.getElementById(id).onclick = () => {
    document.getElementById(id.startsWith('close-auth') ? 'auth-modal' : 'payment-modal').classList.add('hidden');
  });
  ['btnLogin','btnRegister','btnForgot','ricarica','confirmPayment','btnAll','btnLeads','btnAppuntamenti','btnContratti','btnReset']
    .forEach(id => document.getElementById(id).onclick = () => window[id] && window[id]());
  populateFilters(); ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect']
    .forEach(id => document.getElementById(id).onchange = applyFilters);
  fetch(sheetURL).then(r => r.ok? r.text(): Promise.reject(r.status)).then(data => {
    data.trim().split('\n').slice(1).forEach(line => {
      const [regione,citta,categoria,tipo,descrizione,telefono,budget,costo] = line.split('\t');
      window.allItems.push({regione,citta,categoria,tipo,descrizione,telefono,budget:+budget.replace(/[^0-9]/g,''),costo:+costo.replace(/[^0-9]/g,'')});
    });
    applyFilters(); renderCart();
  });
  onAuthStateChanged(auth, user => user && user.emailVerified ? getDoc(doc(db,'users',user.uid))
    .then(s => {window.currentUser={uid:user.uid,credits:s.data().credits};document.getElementById('currentCredits').textContent=user?window.currentUser.credits:0;document.getElementById('currentCreditsEuro').textContent=(window.currentUser.credits).toFixed(2);}):
    (() => {window.currentUser=null;document.getElementById('currentCredits').textContent='0';document.getElementById('currentCreditsEuro').textContent='0.00';})());
});

function filterBySection(key){currentSectionFilter=key;applyFilters();}
function applyFilters(){
  const r=document.getElementById('regioneSelect').value, c=document.getElementById('cittaSelect').value;
  const k=document.getElementById('categoriaSelect').value, t=document.getElementById('tipoSelect').value;
  const filtered=window.allItems.filter(i=> (currentSectionFilter==='all'||i.tipo.toLowerCase().includes(currentSectionFilter))
    && (r==='Tutti'||i.regione===r) && (c==='Tutti'||i.citta===c)
    && (k==='Tutti'||i.categoria===k) && (t==='Tutti'||i.tipo===t));
  renderCards(filtered);
}
function renderCards(arr){
  const cont=document.getElementById('cards-container');cont.innerHTML='';arr.forEach(i=>cont.appendChild(createCard(i)));
}
function createCard(item){
  const cls=item.tipo.toLowerCase().includes('lead')?'lead':item.tipo.toLowerCase().includes('appunt')?'appunt':'contr';
  const card=document.createElement('div');card.className=`cliente-card ${cls}`;
  card.innerHTML=`<h3>${item.citta} – ${item.categoria}</h3><p>${item.regione} | ${item.tipo}</p>
    <p>${item.descrizione}</p><p>Budget: €${item.budget.toFixed(2)}</p>
    <p class="telefono hidden">Tel: ${item.telefono}</p><p>Costo crediti: ${item.costo}</p>
    <button class="${cls}">${cls==='lead'?'Acquisisci':cls==='appunt'?'Conferma':'Contratto'}</button>`;
  card.querySelector('button').onclick=()=>{if(!requireAuth())return;handleAction(item,card);};
  return card;
}
function renderCart(){document.getElementById('cart').innerHTML=`<h2>Carrello</h2><p>Totale crediti: ${window.cart.reduce((s,i)=>s+i.costo,0)}</p>`;}
function changeCredits(delta){if(!window.currentUser)return;const ref=doc(db,'users',window.currentUser.uid);const newc=window.currentUser.credits+delta;
  updateDoc(ref,{credits:newc}).then(()=>{window.currentUser.credits=newc;document.getElementById('currentCredits').textContent=newc;document.getElementById('currentCreditsEuro').textContent=newc.toFixed(2);});}
function requireAuth(){if(!window.currentUser){document.getElementById('auth-modal').classList.remove('hidden');return false;}return true;}
