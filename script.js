const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let data = [], carrello = [];

window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(res => res.text())
    .then(parseTSV)
    .then(parsed => {
      data = parsed;
      populateFilters();
      displayCards(data);
    })
    .catch(console.error);
});

function parseTSV(tsv) {
  const lines = tsv.trim().split('\n');
  const headers = lines.shift().split('\t');
  return lines.map(line => {
    const values = line.split('\t');
    return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim() || '']));
  });
}

function populateFilters() {
  fillSelect('regioneFilter', [...new Set(data.map(d => d.Regione))]);
  fillSelect('cittaFilter', [...new Set(data.map(d => d.Città))]);
  fillSelect('categoriaFilter', [...new Set(data.map(d => d.Categoria))]);
  fillSelect('tipoFilter', [...new Set(data.map(d => d.Tipo))]);

  document.querySelectorAll('.filters select').forEach(select => {
    select.addEventListener('change', applyFilters);
  });
}

function fillSelect(id, values) {
  const select = document.getElementById(id);
  values.sort().forEach(val => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = val;
    select.appendChild(opt);
  });
}

function resetFilters() {
  ['regioneFilter', 'cittaFilter', 'categoriaFilter', 'tipoFilter'].forEach(id => {
    const el = document.getElementById(id);
    el.selectedIndex = 0;
  });
  displayCards(data);
}

function filterByCategoria(cat) {
  const filtered = data.filter(entry => entry.Categoria.toLowerCase().includes(cat.toLowerCase()));
  displayCards(filtered);
}

function applyFilters() {
  const regione = document.getElementById('regioneFilter').value;
  const citta = document.getElementById('cittaFilter').value;
  const categoria = document.getElementById('categoriaFilter').value;
  const tipo = document.getElementById('tipoFilter').value;

  const filtered = data.filter(entry =>
    (regione === "Regione" || entry.Regione === regione) &&
    (citta === "Città" || entry.Città === citta) &&
    (categoria === "Categoria" || entry.Categoria === categoria) &&
    (tipo === "Tipo" || entry.Tipo === tipo)
  );

  displayCards(filtered);
}

function displayCards(filteredData) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  filteredData.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'cliente-card ' + entry.Categoria.toLowerCase();
    card.innerHTML = `
      <span class="badge ${entry.Categoria.toLowerCase()}">${entry.Categoria}</span>
      <h3>${entry.Tipo}</h3>
      <p class="desc">${entry.Descrizione}</p>
      <p><strong>${entry.Città}, ${entry.Regione}</strong></p>
      <p class="commission">Tel: ${entry.Telefono} - Budget: €${entry["Budget (€)"]} - Costo: ${entry["Costo (crediti)"]} crediti</p>
      <div class="actions">
        <button class="acquisisci ${entry.Categoria.toLowerCase()}" onclick="aggiungiACarrello('${entry.Telefono}', ${entry["Costo (crediti)"]})">Aggiungi</button>
        <button class="annulla" onclick="rimuoviDalCarrello('${entry.Telefono}')">Annulla</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function aggiungiACarrello(id, crediti) {
  if (!carrello.find(el => el.id === id)) {
    carrello.push({ id, crediti });
    aggiornaCarrello();
  }
}

function rimuoviDalCarrello(id) {
  carrello = carrello.filter(el => el.id !== id);
  aggiornaCarrello();
}

function aggiornaCarrello() {
  const area = document.getElementById('carrello');
  const totale = document.getElementById('totale');
  area.innerHTML = carrello.map(el => `<div>${el.id} - ${el.crediti} crediti</div>`).join('');
  const somma = carrello.reduce((sum, el) => sum + el.crediti, 0);
  totale.textContent = `Totale crediti: ${somma}`;
}
