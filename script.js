const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let data = [], carrello = [];

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

function setActiveTab(cat) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
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

function parseTSV(tsv) {
  const lines = tsv.trim().split('\n');
  const headers = lines.shift().split('\t');
  return lines.map(line => {
    const vals = line.split('\t');
    return Object.fromEntries(headers.map((h,i) => [h.trim(), vals[i]?.trim() || '']));
  });
}

function populateFilters() {
  ['Regione','Città','Categoria','Tipo'].forEach(key => {
    const sel = document.getElementById(key.toLowerCase() + 'Filter');
    [...new Set(data.map(d => d[key]))].sort().forEach(v => {
      const o = document.createElement('option');
      o.value = o.textContent = v;
      sel.appendChild(o);
    });
  });
  document.querySelectorAll('.filters select')
          .forEach(s => s.addEventListener('change', applyFilters));
}

function resetFilters() {
  ['regione','citta','categoria','tipo']
    .forEach(id => document.getElementById(id + 'Filter').selectedIndex = 0);
  setActiveTab('');
  displayCards(data);
}

function filterByCategoria(cat) {
  setActiveTab(cat);
  displayCards(data.filter(e => e.Categoria === cat));
}

function applyFilters() {
  const r  = document.getElementById('regioneFilter').value;
  const c  = document.getElementById('cittaFilter').value;
  const ca = document.getElementById('categoriaFilter').value;
  const t  = document.getElementById('tipoFilter').value;
  setActiveTab('');
  const filtered = data.filter(e =>
    (r === 'Regione'   || e.Regione   === r) &&
    (c === 'Città'     || e.Città     === c) &&
    (ca === 'Categoria'|| e.Categoria === ca) &&
    (t === 'Tipo'      || e.Tipo      === t)
  );
  displayCards(filtered);
}

function displayCards(list) {
  const cont = document.getElementById('cards-container');
  cont.innerHTML = '';
  list.forEach(e => {
    const div = document.createElement('div');
    div.className = 'cliente-card ' + e.Categoria.toLowerCase();
    div.innerHTML = `
      <span class="badge ${e.Categoria.toLowerCase()}">${e.Categoria}</span>
      <h3>${e.Tipo}</h3>
      <p class="desc">${e.Descrizione}</p>
      <p><strong>${e.Città}, ${e.Regione}</strong></p>
      <p class="commission">
        Tel: ${e.Telefono} – Budget: €${e["Budget (€)"]} – 
        Costo: ${e["Costo (crediti)"]} crediti
      </p>
      <div class="actions">
        <button class="acquisisci ${e.Categoria.toLowerCase()}"
                onclick="aggiungiACarrello('${e.Telefono}', ${e["Costo (crediti)"]})">
          Acquisisci
        </button>
        <button class="annulla" onclick="rimuoviDalCarrello('${e.Telefono}')">
          Annulla
        </button>
      </div>`;
    cont.appendChild(div);
  });
}

function aggiungiACarrello(id, crediti) {
  if (!carrello.find(x => x.id === id)) {
    carrello.push({ id, crediti });
    aggiornaCarrello();
  }
}

function rimuoviDalCarrello(id) {
  carrello = carrello.filter(x => x.id !== id);
  aggiornaCarrello();
}

function aggiornaCarrello() {
  document.getElementById('carrello').innerHTML =
    carrello.map(x => `<div>${x.id} – ${x.crediti} crediti</div>`).join('');
  document.getElementById('totale').textContent =
    `Totale: €${carrello.reduce((sum, x) => sum + x.crediti, 0)}`;
}

function openRicarica() {
  // Qui puoi inserire la logica per aprire il modal PayPal
}
