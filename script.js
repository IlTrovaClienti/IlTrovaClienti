import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

window.allItems = [];
window.cart = [];
let currentSectionFilter = 'all';

const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

document.addEventListener('DOMContentLoaded', () => {
  // Section buttons
  document.getElementById('btnAll').addEventListener('click', () => filterBySection('all'));
  document.getElementById('btnLeads').addEventListener('click', () => filterBySection('lead'));
  document.getElementById('btnAppuntamenti').addEventListener('click', () => filterBySection('appunt'));
  document.getElementById('btnContratti').addEventListener('click', () => filterBySection('contr'));

  // Modal handlers
  const paymentModal = document.getElementById('payment-modal');
  document.getElementById('ricarica').addEventListener('click', () => paymentModal.classList.remove('hidden'));
  document.getElementById('close-payment').addEventListener('click', () => paymentModal.classList.add('hidden'));
  paymentModal.addEventListener('click', e => { if(e.target === paymentModal) paymentModal.classList.add('hidden'); });

  document.getElementById('confirmPayment').addEventListener('click', () => {
    const amt = parseFloat(document.getElementById('paymentAmount').value) || 0;
    changeCredits(amt);
    paymentModal.classList.add('hidden');
  });

  // Fetch data
  fetch(sheetURL).then(res => {
    if (!res.ok) throw new Error('Fetch error ' + res.status);
    return res.text();
  }).then(tsv => {
    const rows = tsv.trim().split('\n').map(r => r.split('\t'));
    rows.shift();
    rows.forEach(cols => {
      const [regione,citta,categoria,tipo,descrizione,telefono,budgetStr,costoStr] = cols;
      window.allItems.push({
        regione, citta, categoria, tipo,
        descrizione, telefono,
        budget: parseFloat(budgetStr.replace(/[^0-9\.,]/g,''))||0,
        costo: parseFloat(costoStr.replace(/[^0-9\.,]/g,''))||0
      });
    });
    populateFilters();
    // Now that filters are populated, set up change listeners
    ['regioneSelect','cittaSelect','categoriaSelect','tipoSelect'].forEach(id => {
      document.getElementById(id).addEventListener('change', applyFilters);
    });
    applyFilters();
    renderCart();
  }).catch(err => {
    console.error('Data load error:', err);
    alert('Errore caricamento dati, vedi console.');
  });

  // Auth state
  onAuthStateChanged(window.firebaseAuth, async user => {
    if (user && user.emailVerified) {
      const snap = await getDoc(doc(window.firebaseDB,'users',user.uid));
      const data = snap.data();
      window.currentUser = { uid: user.uid, credits: data.credits };
      document.getElementById('currentCredits').textContent = data.credits;
      document.getElementById('currentCreditsEuro').textContent = data.credits.toFixed(2);
    }
  });
});

function populateFilters(){
  const regs = ['Tutti', ...new Set(window.allItems.map(i => i.regione))];
  const cits = ['Tutti', ...new Set(window.allItems.map(i => i.citta))];
  const cats = ['Tutti', ...new Set(window.allItems.map(i => i.categoria))];
  const tips = ['Tutti', ...new Set(window.allItems.map(i => i.tipo))];
  ['regioneSelect', 'cittaSelect', 'categoriaSelect', 'tipoSelect'].forEach((id, idx) => {
    const opts = idx===0 ? regs : idx===1 ? cits : idx===2 ? cats : tips;
    const sel = document.getElementById(id);
    sel.innerHTML = opts.map(v => `<option value="\${v}">\${v}</option>`).join('');
  });
}

function filterBySection(key){
  currentSectionFilter = key;
  applyFilters();
}

function applyFilters(){
  const reg = document.getElementById('regioneSelect').value;
  const cit = document.getElementById('cittaSelect').value;
  const cat = document.getElementById('categoriaSelect').value;
  const tip = document.getElementById('tipoSelect').value;
  const filtered = window.allItems.filter(i => {
    if (currentSectionFilter !== 'all' && !i.tipo.toLowerCase().includes(currentSectionFilter)) return false;
    if (reg!=='Tutti' && i.regione!==reg) return false;
    if (cit!=='Tutti' && i.citta!==cit) return false;
    if (cat!=='Tutti' && i.categoria!==cat) return false;
    if (tip!=='Tutti' && i.tipo!==tip) return false;
    return true;
  });
  renderCards(filtered);
}

function renderCards(list){
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  list.forEach(item => container.appendChild(createCard(item)));
}

function createCard(item){
  const card = document.createElement('div');
  card.className = 'cliente-card';
  const btnType = /lead/.test(item.tipo.toLowerCase()) ? 'lead' : /appunt/.test(item.tipo.toLowerCase()) ? 'appunt' : 'contr';
  card.innerHTML = `
    <h3>\${item.citta} – \${item.categoria}</h3>
    <p>\${item.regione} | \${item.tipo}</p>
    <p>\${item.descrizione}</p>
    <p>Budget: €\${item.budget.toFixed(2)}</p>
    <p class="telefono hidden">Telefono: \${item.telefono}</p>
    <p>Costo crediti: \${item.costo}</p>
    <button class="\${btnType}">\${btnType==='lead'?'Acquisisci':btnType==='appunt'?'Conferma':'Contratto'}</button>
  `;
  card.querySelector('button').addEventListener('click', e => {
    window.cart.push(item);
    renderCart();
    const tel = card.querySelector('.telefono');
    if (!window.currentUser || item.costo > window.currentUser.credits) {
      alert('Crediti insufficienti, ricarica!');
      document.getElementById('payment-modal').classList.remove('hidden');
    } else {
      changeCredits(-item.costo);
      tel.classList.remove('hidden');
    }
  });
  return card;
}

function renderCart(){
  const tot = window.cart.reduce((s,i)=>s+i.costo,0);
  document.getElementById('cart').innerHTML = `<h2>Carrello</h2><p>Totale crediti: ${tot}</p>`;
}

async function changeCredits(delta){
  if (!window.currentUser) return;
  const ref = doc(window.firebaseDB,'users',window.currentUser.uid);
  const newVal = window.currentUser.credits + delta;
  await updateDoc(ref,{credits:newVal});
  window.currentUser.credits = newVal;
  document.getElementById('currentCredits').textContent = newVal;
  document.getElementById('currentCreditsEuro').textContent = newVal.toFixed(2);
}