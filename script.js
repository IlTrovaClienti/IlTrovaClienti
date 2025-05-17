
// === Config ===
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv";
let userCrediti = 5;
const EURO_PER_CREDITO = 40;

// === Stato ===
let data = [];
let carrello = [];
let nascosti = new Set();

// === Elementi ===
const creditiEl = document.getElementById('crediti');
const euroCreditiEl = document.getElementById('euroCrediti');
const cardsEl = document.getElementById('cards');
const carrelloListEl = document.getElementById('carrelloList');
const totaleCarrelloEl = document.getElementById('totaleCarrello');

// === Aggiorna crediti iniziali ===
updateCrediti();

// === Carica TSV ===
fetch(SHEET_URL)
  .then(r => r.text())
  .then(parseTSV)
  .then(rows => {
      data = rows;
      populateFilters();
      renderCards();
  })
  .catch(err => console.error(err));

function parseTSV(tsv){
  const lines = tsv.trim().split('\n').map(l=>l.split('\t'));
  const header = lines.shift();
  return lines.map((row,i)=>{
      const obj = {};
      header.forEach((h,idx)=>obj[h.trim()] = row[idx] || '');
      obj.__id = 'row'+i;
      return obj;
  });
}

// === Filtri ===
const selects = {
  regione: document.getElementById('regione'),
  citta: document.getElementById('citta'),
  categoria: document.getElementById('categoria'),
  tipo: document.getElementById('tipo')
};
Object.values(selects).forEach(sel => sel.onchange = renderCards);

function populateFilters(){
  const map = { regione:'Regione', citta:'Città', categoria:'Categoria', tipo:'Tipo' };
  for(const key in map){
     const col = map[key];
     const sel = selects[key];
     const opts = [...new Set(data.map(d=>d[col]).filter(Boolean))].sort();
     sel.innerHTML = '<option value="">Tutti</option>' + opts.map(v=>`<option value="${v}">${v}</option>`).join('');
  }
}

// === Rendering cards ===
function renderCards(){
  const filt = {
    Regione: selects.regione.value,
    'Città': selects.citta.value,
    Categoria: selects.categoria.value,
    Tipo: selects.tipo.value
  };
  const visible = data.filter(d =>
    (!filt.Regione || d.Regione === filt.Regione) &&
    (!filt['Città'] || d['Città'] === filt['Città']) &&
    (!filt.Categoria || d.Categoria === filt.Categoria) &&
    (!filt.Tipo || d.Tipo === filt.Tipo) &&
    !nascosti.has(d.__id)
  );
  cardsEl.innerHTML = visible.map(cardHTML).join('');
}
function cardHTML(d){
  const cls = d.Tipo==='Lead' ? 'lead' : (d.Tipo==='Appuntamento' ? 'app' : 'contr');
  const prezzo = Number(d.Prezzo||0);
  return `<div class="card ${cls}">
    <strong>${d.Descrizione||''}</strong><br>
    <small>${d.Regione} / ${d['Città']} – ${d.Categoria}</small><br>
    <b>Prezzo: €${prezzo}</b><br>
    <button onclick="acquisisci('${d.__id}',${prezzo})">Acquisisci</button>
  </div>`;
}

// === Carrello ===
function acquisisci(id, prezzo){
  nascosti.add(id);
  carrello.push({id, prezzo});
  renderCarrello();
  renderCards();
}
function removeCart(idx){
  const item = carrello[idx];
  carrello.splice(idx,1);
  nascosti.delete(item.id);
  renderCarrello();
  renderCards();
}
function renderCarrello(){
  carrelloListEl.innerHTML = carrello.map((c,i)=>`<li>#${i+1} €${c.prezzo} <button onclick="removeCart(${i})">Annulla</button></li>`).join('');
  totaleCarrelloEl.textContent = carrello.reduce((s,c)=>s+c.prezzo,0).toFixed(2);
}

// === Crediti ===
function updateCrediti(){
  creditiEl.textContent = userCrediti;
  euroCreditiEl.textContent = (userCrediti*EURO_PER_CREDITO).toFixed(2);
}
