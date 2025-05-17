/* === CONFIG === */
const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?gid=71180301&output=tsv';
const REVOLUT_LINK =
  'https://checkout.revolut.com/pay/716c6260-3151-4a9b-ba52-670eb35db1b4';

let credits = 0;
const EUR_PER_CREDIT = 40;
let rows = [];                       // righe TSV
let bought = new Set();              // id card già acquisite

/* === DOM === */
const creditsEl  = document.getElementById('crediti');
const euroEl     = document.getElementById('euroCrediti');
const mask       = document.getElementById('mask');
const modal      = document.getElementById('modalPay');
const ibanBox    = document.getElementById('ibanBox');

/* === Mapping colonne tollerante === */
const COL = {
  Regione:  ['Regione'],
  Citta:    ['Città','Citta'],
  Categoria:['Categoria'],
  Tipo:     ['Tipo','Stato'],
  Costo:    ['Costo (crediti)','Costo crediti','Crediti'],
  Tel:      ['Telefono']
};
const V = (r, keys) => { for (const k of keys) if (r[k] !== undefined) return r[k].trim(); return ''; };

/* === Modal pagamento === */
btnRicarica.onclick = () => openModal();
closeModal.onclick  = closeModal;
mask.onclick        = closeModal;
payRevolut.onclick  = () => { addCredits(10); closeModal(); window.open(REVOLUT_LINK,'_blank'); };
showIban.onclick    = () => ibanBox.classList.toggle('hidden');

function openModal(){ mask.classList.add('open'); modal.classList.add('open'); }
function closeModal(){ mask.classList.remove('open'); modal.classList.remove('open'); }
function addCredits(n){ credits += n; updateCredits(); }

function updateCredits(){
  creditsEl.textContent = credits;
  euroEl.textContent    = (credits * EUR_PER_CREDIT).toFixed(0);
}
updateCredits();

/* === TSV === */
fetch(SHEET_URL)
  .then(r => r.text())
  .then(txt => { rows = parseTSV(txt); initFilters(); renderCards(); })
  .catch(console.error);

function parseTSV(tsv){
  const lines = tsv.trim().split('\n').map(r => r.split('\t'));
  const head  = lines.shift();
  return lines.map((r,i)=>{ const o={__id:'row'+i}; head.forEach((h,idx)=> o[h.trim()] = r[idx] || ''); return o; });
}

/* === Filtri === */
const sel = {
  Regione:   document.getElementById('regioneFilter'),
  Citta:     document.getElementById('cittaFilter'),
  Categoria: document.getElementById('categoriaFilter'),
  Tipo:      document.getElementById('tipoFilter')
};
Object.values(sel).forEach(s=>s.onchange = renderCards);

document.querySelectorAll('.tab').forEach(btn => btn.onclick = e => {
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  e.currentTarget.classList.add('active');
  sel.Tipo.value = e.currentTarget.dataset.type;
  renderCards();
});

function initFilters(){
  for(const [logic,keys] of Object.entries(COL).filter(([k])=>!['Costo','Tel'].includes(k))){
    const vals = [...new Set(rows.map(r => V(r,keys)).filter(Boolean))].sort();
    sel[logic].innerHTML = '<option value="">Tutti</option>' +
       vals.map(v=>`<option>${v}</option>`).join('');
  }
}

/* === Card render === */
function normalize(tipo){
  tipo = tipo.toLowerCase();
  return tipo.startsWith('lead') ? 'lead'
       : tipo.startsWith('app')  ? 'app'
       : 'contr';
}

function renderCards(){
  const f = {Regione:sel.Regione.value, Citta:sel.Citta.value, Categoria:sel.Categoria.value, Tipo:sel.Tipo.value};
  const list = rows.filter(r =>
    (!f.Regione  || V(r,COL.Regione)   === f.Regione) &&
    (!f.Citta    || V(r,COL.Citta)     === f.Citta)   &&
    (!f.Categoria|| V(r,COL.Categoria) === f.Categoria) &&
    (!f.Tipo     || V(r,COL.Tipo)      === f.Tipo)
  );

  cards.innerHTML = list.map(cardHTML).join('');
}

function cardHTML(r){
  const tipo  = V(r,COL.Tipo);
  const cls   = normalize(tipo);
  const cost  = Number(V(r,COL.Costo) || 1);
  const isBought = bought.has(r.__id);
  const phone = isBought ? V(r,COL.Tel) : '•••••••••';
  const btn   = isBought
     ? `<button class="btn btn-grey" onclick="undo('${r.__id}',${cost})">Annulla (-${cost} cr)</button>`
     : `<button class="btn btn-green" onclick="acq('${r.__id}',${cost})">Acquisisci (+${cost} cr)</button>`;

  return `<div class="card ${cls}">
      <h4>${r.Descrizione || ''}</h4>
      <small>${V(r,COL.Regione)} / ${V(r,COL.Citta)} – ${V(r,COL.Categoria)}</small>
      <span class="badge ${cls}">${tipo}</span>
      <p><b>Telefono:</b> ${phone}</p>
      ${btn}
    </div>`;
}

/* === Azioni === */
function acq(id,cost){
  if (credits < cost){ openModal(); return; }
  credits -= cost; updateCredits();
  bought.add(id);  renderCards();
}
function undo(id,cost){
  if (!bought.has(id)) return;
  credits += cost; updateCredits();
  bought.delete(id); renderCards();
}
