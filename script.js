// script.js

const sheetURL = ''https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let data = [], carrello = [];

// Qui la mappatura colonna TSV → ID esatto del <select>
const filters = [
  { col: 'Regione',   id: 'regioneFilter' },
  { col: 'Città',     id: 'cittaFilter'   },
  { col: 'Categoria', id: 'categoriaFilter' },
  { col: 'Tipo',      id: 'tipoFilter'     },
];

window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(r => r.text())
    .then(parseTSV)
    .then(parsed => {
      data = parsed;
      populateFilters();
      resetFilters();
    })
    .catch(console.error);
});

function parseTSV(tsv) {
  const lines = tsv.trim().split('\n');
  const headers = lines.shift().split('\t');
  return lines.map(line => {
    const vals = line.split('\t');
    return Object.fromEntries(headers.map((h,i)=>[h.trim(), vals[i]?.trim()||'']));
  });
}

function populateFilters() {
  filters.forEach(({ col, id }) => {
    const sel = document.getElementById(id);
    // rimuove opzioni vecchie (a parte il placeholder)
    sel.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove());
    // crea opzioni uniche ordinate
    [...new Set(data.map(r=>r[col]))]
      .sort()
      .forEach(v=>{
        const o = document.createElement('option');
        o.value = o.textContent = v;
        sel.appendChild(o);
      });
  });
  document.querySelectorAll('.filters select')
          .forEach(s=>s.addEventListener('change', applyFilters));
}

function resetFilters() {
  filters.forEach(({ id })=>{
    document.getElementById(id).selectedIndex = 0;
  });
  setActiveTab('');
  displayCards(data);
}

function filterByCategoria(cat) {
  setActiveTab(cat);
  displayCards(data.filter(r=>r.Categoria===cat));
}

function applyFilters() {
  // raccoglie i valori correnti da ciascun <select>
  const criteria = {};
  filters.forEach(({ col, id })=>{
    criteria[col] = document.getElementById(id).value;
  });
  setActiveTab('');
  // filtra solo le righe che matchano tutti i campi selezionati
  const filtered = data.filter(r=>{
    return filters.every(({ col })=>{
      const sel = criteria[col];
      return sel===col || r[col]===sel;
    });
  });
  displayCards(filtered);
}

function setActiveTab(cat) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  switch(cat) {
    case 'Lead':
      document.getElementById('tab-leads').classList.add('active');
      break;
    case 'Appuntamento':
      document.getElementById('tab-appuntamenti').classList.add('active');
      break;
    case 'Contratto':
      document.getElementById('tab-contratti').classList.add('active');
      break;
    default:
      document.getElementById('tab-tutti').classList.add('active');
  }
}

function displayCards(list) {
  const c = document.getElementById('cards-container');
  c.innerHTML = '';
  list.forEach(r=>{
    const div=document.createElement('div');
    div.className = 'cliente-card ' + r.Categoria.toLowerCase();
    div.innerHTML = `
      <span class="badge ${r.Categoria.toLowerCase()}">${r.Categoria}</span>
      <h3>${r.Tipo}</h3>
      <p class="desc">${r.Descrizione}</p>
      <p><strong>${r.Città}, ${r.Regione}</strong></p>
      <p class="commission">
        Tel: ${r.Telefono} – Budget: €${r["Budget (€)"]} – 
        Costo: ${r["Costo (crediti)"]} crediti
      </p>
      <div class="actions">
        <button class="acquisisci ${r.Categoria.toLowerCase()}"
                onclick="aggiungiACarrello('${r.Telefono}', ${r["Costo (crediti)"]})">
          Acquisisci
        </button>
        <button class="annulla" onclick="rimuoviDalCarrello('${r.Telefono}')">
          Annulla
        </button>
      </div>`;
    c.appendChild(div);
  });
}

function aggiungiACarrello(id, cred) {
  if (!carrello.find(x=>x.id===id)) {
    carrello.push({ id, crediti: cred });
    aggiornaCarrello();
  }
}

function rimuoviDalCarrello(id) {
  carrello = carrello.filter(x=>x.id!==id);
  aggiornaCarrello();
}

function aggiornaCarrello() {
  document.getElementById('carrello').innerHTML =
    carrello.map(x=>`<div>${x.id} – ${x.crediti} crediti</div>`).join('');
  document.getElementById('totale').textContent =
    `Totale: €${carrello.reduce((s,x)=>s+x.crediti,0)}`;
}

function openRicarica() {
  // logica per aprire il modal PayPal
}
