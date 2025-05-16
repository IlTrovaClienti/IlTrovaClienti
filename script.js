// script.js

const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let data = [], carrello = [];

// colonne & select IDs
const cols = ['Regione','Città','Categoria','Tipo'];
const sids = ['regione','citta','categoria','tipo'];

// mappa stringa esatta → colore
const colorMap = {
  'Lead da chiamare':     '#0085FF',
  'Appuntamento fissato': '#FF00FF',
  'Contratto riservato':  '#FFD700'
};

window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(r => r.text())
    .then(parseTSV)
    .then(parsed => {
      data = parsed;
      setupFilters();
      drawCards(data);
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

function setupFilters() {
  cols.forEach((col,i) => {
    const sel = document.getElementById(sids[i]);
    sel.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove());
    [...new Set(data.map(r=>r[col]))].sort().forEach(val => {
      const o = document.createElement('option');
      o.value = o.textContent = val;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => {
      const filtered = applyFilters();
      drawCards(filtered);
    });
  });
}

function applyFilters() {
  const crit = {};
  sids.forEach((id,i)=> crit[cols[i]] = document.getElementById(id).value );
  return data.filter(r =>
    cols.every(c => crit[c]==='Tutti' || r[c]===crit[c])
  );
}

function drawCards(list) {
  const main = document.getElementById('clienti');
  main.innerHTML = '';
  list.forEach(r => {
    const badgeText = r.Categoria;  // es. "Lead da chiamare"
    const borderColor = colorMap[badgeText] || 'transparent';

    const card = document.createElement('div');
    card.className = 'cliente-card';
    card.style.borderLeft = `4px solid ${borderColor}`;

    card.innerHTML = `
      <span class="badge ${badgeText.replace(/\\s+/g,'').toLowerCase()}">
        ${badgeText}
      </span>
      <h3>${r.Tipo}</h3>
      <p class="desc">${r.Descrizione}</p>
      <p><strong>${r.Città}, ${r.Regione}</strong></p>
      <p class="commission">
        Tel: ${r.Telefono} – Budget: €${r["Budget (€)"]} – 
        Costo: ${r["Costo (crediti)"]} crediti
      </p>
      <div class="actions">
        <button class="acquisisci" onclick="addToCart('${r.Telefono}', ${r["Costo (crediti)"]})">
          Acquisisci
        </button>
        <button class="annulla" onclick="removeFromCart('${r.Telefono}')">
          Annulla
        </button>
      </div>`;
    main.appendChild(card);
  });
}

function addToCart(id, cred) {
  if (!carrello.find(x=>x.id===id)) {
    carrello.push({id, cred});
    updateCart();
  }
}

function removeFromCart(id) {
  carrello = carrello.filter(x=>x.id!==id);
  updateCart();
}

function updateCart() {
  document.getElementById('carrello').innerHTML =
    carrello.map(x=>`<li>${x.id} – ${x.cred} crediti</li>`).join('');
  document.getElementById('totale').textContent =
    `Totale: €${carrello.reduce((s,x)=>s+x.cred,0)}`;
}

function resetFilters() {
  ['regione','citta','categoria','tipo'].forEach(id=>{
    document.getElementById(id).value = 'Tutti';
  });
  drawCards(data);
}

function filterByCategoria(cat) {
  drawCards(data.filter(r=>r.Categoria===cat));
}

function openRicarica() {
  alert('Funzione ricarica non implementata qui');
}
