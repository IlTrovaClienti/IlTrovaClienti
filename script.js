import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

window.allItems = [];
window.cart = [];
let currentSectionFilter = 'all';

const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

document.addEventListener('DOMContentLoaded', async () => {
  const selects = ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'];
  const filters = {};
  selects.forEach(id => filters[id] = document.getElementById(id));

  document.getElementById('btnAll').addEventListener('click', () => filterBySection('all'));
  document.getElementById('btnLeads').addEventListener('click', () => filterBySection('lead'));
  document.getElementById('btnAppuntamenti').addEventListener('click', () => filterBySection('appunt'));
  document.getElementById('btnContratti').addEventListener('click', () => filterBySection('contr'));

  document.getElementById('ricarica').addEventListener('click', () => document.getElementById('payment-modal').classList.remove('hidden'));
  document.getElementById('close-payment').addEventListener('click', () => document.getElementById('payment-modal').classList.add('hidden'));
  document.getElementById('confirmPayment').addEventListener('click', () => {
    const amt = parseFloat(document.getElementById('paymentAmount').value) || 0;
    if (amt>0) changeCredits(amt);
    document.getElementById('payment-modal').classList.add('hidden');
  });

  try {
    const res = await fetch(sheetURL);
    if (!res.ok) throw new Error(res.status);
    const tsv = await res.text();
    const rows = tsv.trim().split('\n').map(r=>r.split('\t'));
    rows.shift();
    rows.forEach(cols=>{
      const [regione,citta,categoria,tipo,descrizione,telefono,budgetStr,costoStr] = cols;
      const budget = parseFloat(budgetStr.replace(/[^0-9\.,]/g,''))||0;
      const costo = parseFloat(costoStr.replace(/[^0-9\.,]/g,''))||0;
      window.allItems.push({regione,citta,categoria,tipo,descrizione,telefono,budget,costo});
    });
    populateFilters();
    selects.forEach(id=>filters[id].addEventListener('change',applyFilters));
    applyFilters();
    renderCart();
  } catch(err) {
    console.error(err);
    alert("Errore caricamento dati");
  }

  onAuthStateChanged(window.firebaseAuth, async user=>{
    if(user&&user.emailVerified){
      const snap = await getDoc(doc(window.firebaseDB,'users',user.uid));
      const data = snap.data();
      window.currentUser={uid:user.uid,credits:data.credits};
      document.getElementById('currentCredits').textContent=data.credits;
      document.getElementById('currentCreditsEuro').textContent=data.credits.toFixed(2);
    }
  });
});

function populateFilters(){
  const regs = ['Tutti',...new Set(window.allItems.map(i=>i.regione))];
  const cits = ['Tutti',...new Set(window.allItems.map(i=>i.citta))];
  const cats = ['Tutti',...new Set(window.allItems.map(i=>i.categoria))];
  const tips = ['Tutti',...new Set(window.allItems.map(i=>i.tipo))];
  fill('regioneSelect',regs);
  fill('cittaSelect',cits);
  fill('categoriaSelect',cats);
  fill('tipoSelect',tips);
}

function fill(id,vals){
  const sel=document.getElementById(id);
  sel.innerHTML='';
  vals.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);});
}

function filterBySection(key){
  currentSectionFilter=key; applyFilters();
}

function applyFilters(){
  const reg = document.getElementById('regioneSelect').value;
  const cit = document.getElementById('cittaSelect').value;
  const cat = document.getElementById('categoriaSelect').value;
  const tip = document.getElementById('tipoSelect').value;
  const filtered = window.allItems.filter(item=>{
    if(currentSectionFilter!=='all' && !item.tipo.toLowerCase().includes(currentSectionFilter)) return false;
    if(reg!=='Tutti' && item.regione!==reg) return false;
    if(cit!=='Tutti' && item.citta!==cit) return false;
    if(cat!=='Tutti' && item.categoria!==cat) return false;
    if(tip!=='Tutti' && item.tipo!==tip) return false;
    return true;
  });
  renderCards(filtered);
}

function renderCards(list){
  const c=document.getElementById('cards-container'); c.innerHTML='';
  list.forEach(item=>{ const card=createCard(item); c.appendChild(card); });
}

function createCard(item){
  const card=document.createElement('div'); card.className='cliente-card';
  const btnType = /lead/.test(item.tipo.toLowerCase())?'lead':/appunt/.test(item.tipo.toLowerCase())?'appunt':'contr';
  card.innerHTML=`
    <h3>${item.citta} – ${item.categoria}</h3>
    <p>${item.regione} | ${item.tipo}</p>
    <p>${item.descrizione}</p>
    <p>Budget: €${item.budget.toFixed(2)}</p>
    <p class="telefono hidden">Telefono: ${item.telefono}</p>
    <p>Costo crediti: ${item.costo}</p>
    <button class="${btnType}">${btnType==='lead'?'Acquisisci':btnType==='appunt'?'Conferma':'Contratto'}</button>
  `;
  card.querySelector('button').addEventListener('click',e=>handleAction(e,item));
  return card;
}

function handleAction(e,item){
  const card=e.currentTarget.closest('.cliente-card');
  const tel=card.querySelector('.telefono');
  window.cart.push(item); renderCart();
  if(!window.currentUser||item.costo>window.currentUser.credits){
    alert('Crediti insufficienti, ricarica!');
    document.getElementById('payment-modal').classList.remove('hidden');
  } else {
    changeCredits(-item.costo);
    tel.classList.remove('hidden');
  }
}

function renderCart(){
  const tot=window.cart.reduce((s,i)=>s+i.costo,0);
  document.getElementById('cart').innerHTML=`<h2>Carrello</h2><p>Totale crediti: ${tot}</p>`;
}

async function changeCredits(delta){
  if(!window.currentUser) return;
  const ref=doc(window.firebaseDB,'users',window.currentUser.uid);
  const newVal=window.currentUser.credits+delta;
  await updateDoc(ref,{credits:newVal});
  window.currentUser.credits=newVal;
  document.getElementById('currentCredits').textContent=newVal;
  document.getElementById('currentCreditsEuro').textContent=newVal.toFixed(2);
}