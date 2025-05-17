
// === Config ===
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?gid=71180301&single=true&output=tsv";
let userCredits = 5;
const EUR_PER_CREDIT = 40;

// === State ===
let rows = [];
let cart = [];
const hiddenIds = new Set();

// === DOM ===
const creditsEl = document.getElementById('crediti');
const euroEl    = document.getElementById('euroCrediti');
const cardsEl   = document.getElementById('cards');
const cartListEl= document.getElementById('cartList');
const cartTotalEl=document.getElementById('cartTotal');

// === Filters
const selReg = document.getElementById('regioneFilter');
const selCit = document.getElementById('cittaFilter');
const selCat = document.getElementById('categoriaFilter');
const selTipo= document.getElementById('tipoFilter');
[selReg,selCit,selCat,selTipo].forEach(s=>s.onchange=renderCards);

// === Tabs
document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click',e=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    selTipo.value = e.currentTarget.dataset.type;
    renderCards();
  });
});

// === Init
updateCredits();
loadTSV();

// ---------------- Functions ----------------
function updateCredits(){
  creditsEl.textContent = userCredits;
  euroEl.textContent = (userCredits*EUR_PER_CREDIT).toFixed(2);
}

function loadTSV(){
  fetch(SHEET_URL)
    .then(r=>r.text())
    .then(tsv=>{ rows = parseTSV(tsv); initFilters(); renderCards(); })
    .catch(console.error);
}

function parseTSV(tsv){
  const lines = tsv.trim().split('\n').map(l=>l.split('\t'));
  const header = lines.shift();
  return lines.map((r,i)=>{
     const obj = {};
     header.forEach((h,idx)=>obj[h.trim()] = r[idx] || '');
     obj.__id = 'row'+i;
     return obj;
  });
}

function initFilters(){
  const map = {regione:'Regione', citta:'Città', categoria:'Categoria', tipo:'Tipo'};
  Object.entries(map).forEach(([id,col])=>{
    const sel = document.getElementById(id+'Filter');
    const values = [...new Set(rows.map(d=>d[col]).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">Tutti</option>'+values.map(v=>`<option value="${v}">${v}</option>`).join('');
  });
}

function renderCards(){
  const filt = { Regione:selReg.value, 'Città':selCit.value, Categoria:selCat.value, Tipo:selTipo.value };
  const vis = rows.filter(d=>
    (!filt.Regione || d.Regione===filt.Regione) &&
    (!filt['Città'] || d['Città']===filt['Città']) &&
    (!filt.Categoria || d.Categoria===filt.Categoria) &&
    (!filt.Tipo || d.Tipo===filt.Tipo) &&
    !hiddenIds.has(d.__id)
  );
  cardsEl.innerHTML = vis.map(cardHTML).join('');
}

function cardHTML(d){
  const cls = d.Tipo==='Lead'?'lead':(d.Tipo==='Appuntamento'?'app':'contr');
  const price = Number(d.Prezzo||0);
  return `<div class="card ${cls}">
    <strong>${d.Descrizione||''}</strong><br>
    <small>${d.Regione} / ${d['Città']} – ${d.Categoria}</small><br>
    <b>Prezzo: €${price}</b><br>
    <button onclick="addToCart('${d.__id}',${price})">Acquisisci</button>
  </div>`;
}

function addToCart(id, price){
  hiddenIds.add(id);
  cart.push({id,price});
  renderCart();
  renderCards();
}

function renderCart(){
  cartListEl.innerHTML = cart.map((c,i)=>`<li>#${i+1} €${c.price} <button onclick="undoCart(${i})">Annulla</button></li>`).join('');
  cartTotalEl.textContent = cart.reduce((s,c)=>s+c.price,0).toFixed(2);
}

function undoCart(idx){
  const item = cart[idx];
  cart.splice(idx,1);
  hiddenIds.delete(item.id);
  renderCart();
  renderCards();
}
