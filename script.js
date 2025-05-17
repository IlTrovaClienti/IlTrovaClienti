/* === CONFIG === */
const SHEET_URL    = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?gid=71180301&output=tsv';
const REVOLUT_LINK = 'https://checkout.revolut.com/pay/716c6260-3151-4a9b-ba52-670eb35db1b4';

let credits = 0;
const EUR_PER_CREDIT = 40;
let rows = [], bought = new Set();

/* === DOM HELPERS === */
const $ = id => document.getElementById(id);

/* === Firebase Auth State === */
let currentUser = null;
firebase.auth().onAuthStateChanged(u => {
  currentUser = u;
  $('btnLogin').classList.toggle('hidden', !!u);
  $('btnLogout').classList.toggle('hidden', !u);
});

/* === Login/Signup === */
$('btnLogin').onclick   = openLogin;
$('closeLogin').onclick = closeLogin;
$('loginMask').onclick  = closeLogin;
$('doLogin').onclick    = () => firebase.auth().signInWithEmailAndPassword($('loginEmail').value, $('loginPassword').value).catch(alert);
$('doSignup').onclick   = () => firebase.auth().createUserWithEmailAndPassword($('loginEmail').value, $('loginPassword').value).catch(alert);
$('btnLogout').onclick  = () => firebase.auth().signOut();

function openLogin(){
  $('loginMask').classList.add('open');
  $('loginModal').classList.add('open');
}
function closeLogin(){
  $('loginMask').classList.remove('open');
  $('loginModal').classList.remove('open');
}

/* === Modali Pagamento === */
$('btnRicarica').onclick = openPay;
$('closePay').onclick    = closePay;
$('payMask').onclick     = closePay;
$('payRevolut').onclick  = ()=>{ addCredits(10); closePay(); window.open(REVOLUT_LINK,'_blank'); };
$('showIban').onclick    = ()=>$('ibanBox').classList.toggle('hidden');

function openPay(){
  $('payMask').classList.add('open');
  $('payModal').classList.add('open');
}
function closePay(){
  $('payMask').classList.remove('open');
  $('payModal').classList.remove('open');
}

/* === Crediti === */
function addCredits(n){ credits += n; updateCredits(); }
function useCredits(n){ credits -= n; updateCredits(); }
function updateCredits(){
  $('crediti').textContent     = credits;
  $('euroCrediti').textContent = (credits * EUR_PER_CREDIT).toFixed(0);
}
updateCredits();

/* === Column Mapping === */
const COL = {
  Regione:   ['Regione'],
  Citta:     ['Città','Citta'],
  Categoria: ['Categoria'],
  Tipo:      ['Tipo','Stato'],
  Costo:     ['Costo (crediti)','Costo crediti','Crediti'],
  Tel:       ['Telefono']
};
const V = (r, keys) => {
  for (const k of keys) if (r[k] !== undefined) return r[k].trim();
  return '';
};

/* === Load & Parse TSV === */
fetch(SHEET_URL)
  .then(r => r.text())
  .then(txt => {
    rows = parseTSV(txt);
    initFilters();
    renderCards();
  })
  .catch(console.error);

function parseTSV(tsv){
  const lines = tsv.trim().split('\n').map(l => l.split('\t'));
  const head  = lines.shift();
  return lines.map((r,i) => {
    const o = { __id:'row'+i };
    head.forEach((h,j) => o[h.trim()] = r[j]||'');
    return o;
  });
}

/* === Filters & Tabs === */
const sel = {
  Regione:   $('regioneFilter'),
  Citta:     $('cittaFilter'),
  Categoria: $('categoriaFilter'),
  Tipo:      $('tipoFilter')
};
Object.values(sel).forEach(s=>s.onchange=renderCards);

document.querySelectorAll('.tab').forEach(b=>b.onclick=e=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  e.currentTarget.classList.add('active');
  currentFilter = e.currentTarget.dataset.filter;
  renderCards();
});

// default
let currentFilter = 'all';

function initFilters(){
  for(const [key,keys] of Object.entries(COL).filter(([k])=>!['Costo','Tel'].includes(k))){
    const opts=[...new Set(rows.map(r=>V(r,keys)).filter(Boolean))].sort();
    sel[key].innerHTML = '<option value="">Tutti</option>'+opts.map(v=>`<option>${v}</option>`).join('');
  }
}

/* === Render Cards === */
function normalize(tipo){
  tipo = tipo.toLowerCase();
  return tipo.startsWith('lead') ? 'lead'
       : tipo.startsWith('app')  ? 'app'
       : 'contr';
}

function renderCards(){
  const f = {
    Regione:   sel.Regione.value,
    Citta:     sel.Citta.value,
    Categoria: sel.Categoria.value,
    Tipo:      sel.Tipo.value
  };
  const list = rows.filter(r => {
    if (currentFilter!=='all' && normalize(V(r,COL.Tipo))!==currentFilter) return false;
    if (f.Regione   && V(r,COL.Regione)!==f.Regione)   return false;
    if (f.Citta     && V(r,COL.Citta)!==f.Citta)       return false;
    if (f.Categoria && V(r,COL.Categoria)!==f.Categoria) return false;
    if (f.Tipo      && V(r,COL.Tipo)!==f.Tipo)         return false;
    return true;
  });
  $('cards').innerHTML = list.map(cardHTML).join('');
}

function cardHTML(r){
  const tipo = V(r,COL.Tipo), cls = normalize(tipo);
  const cost = Number(V(r,COL.Costo)||1), has = bought.has(r.__id);
  const phone = has ? V(r,COL.Tel) : '•••••••••';
  let btn;
  if (cls==='contr'){
    btn = `<button class="btn btn-pink" onclick="openReserve()">Riserva</button>`;
  } else {
    btn = has
      ? `<button class="btn btn-grey" onclick="undo('${r.__id}',${cost})">Annulla (-${cost} cr)</button>`
      : `<button class="btn btn-green" onclick="acq('${r.__id}',${cost})">Acquisisci (+${cost} cr)</button>`;
  }
  return `<div class="card ${cls}">
    <h4>${r.Descrizione||''}</h4>
    <small>${V(r,COL.Regione)} / ${V(r,COL.Citta)} – ${V(r,COL.Categoria)}</small>
    <span class="badge ${cls}">${tipo}</span>
    <p><b>Telefono:</b> ${phone}</p>
    ${btn}
  </div>`;
}

/* === Actions === */
function acq(id,cost){
  if (!currentUser){ openLogin(); return; }
  if (credits < cost){ openPay(); return; }
  useCredits(cost);
  bought.add(id);
  renderCards();
}
function undo(id,cost){
  if (!bought.has(id)) return;
  addCredits(cost);
  bought.delete(id);
  renderCards();
}

/* === Reserve Contratto === */
function openReserve(){
  $('resMask').classList.add('open');
  $('resModal').classList.add('open');
}
$('closeRes').onclick = $('resMask').onclick = ()=>{
  $('resMask').classList.remove('open');
  $('resModal').classList.remove('open');
};
$('doReserve').onclick = ()=>{
  alert('Richiesta di riserva inviata!');
  $('closeRes').onclick();
};
