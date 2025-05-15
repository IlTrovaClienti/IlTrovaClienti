const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let data = [];

window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(res => res.text())
    .then(parseTSV)
    .then(parsed => {
      data = parsed;
      populateFilters();
      displayCards(data);
    });
});

function parseTSV(tsv) {
  const lines = tsv.trim().split('\n');
  const headers = lines.shift().split('\t');
  return lines.map(line => {
    const values = line.split('\t');
    return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i] || '']));
  });
}

function populateFilters() {
  const regioni = [...new Set(data.map(d => d.Regione))];
  const citta = [...new Set(data.map(d => d.Città))];
  const categorie = [...new Set(data.map(d => d.Categoria))];
  const tipi = [...new Set(data.map(d => d.Tipo))];

  fillSelect('regioneFilter', regioni);
  fillSelect('cittaFilter', citta);
  fillSelect('categoriaFilter', categorie);
  fillSelect('tipoFilter', tipi);
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

function applyFilters() {
  const regione = document.getElementById('regioneFilter').value;
  const citta = document.getElementById('cittaFilter').value;
  const categoria = document.getElementById('categoriaFilter').value;
  const tipo = document.getElementById('tipoFilter').value;

  const filtered = data.filter(entry => {
    return (
      (regione === 'Regione' || entry.Regione === regione) &&
      (citta === 'Città' || entry.Città === citta) &&
      (categoria === 'Categoria' || entry.Categoria === categoria) &&
      (tipo === 'Tipo' || entry.Tipo === tipo)
    );
  });

  displayCards(filtered);
}

function displayCards(filteredData) {
  const container = document.getElementById('cardContainer');
  container.innerHTML = '';
  filteredData.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${entry.Categoria} - ${entry.Tipo}</h3>
      <p>${entry.Descrizione}</p>
      <p><strong>${entry.Città}, ${entry.Regione}</strong></p>
      <p>Tel: ${entry.Telefono}</p>
      <p>Budget: €${entry["Budget (€)"]} | Costo: ${entry["Costo (crediti)"]} crediti</p>
      <div class="card-action">
        <button class="btn ${getBtnClass(entry.Categoria)}">Aggiungi</button>
        <button class="btn btn-annulla">Annulla</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function getBtnClass(cat) {
  const catLower = cat.toLowerCase();
  if (catLower.includes('lead')) return 'btn-lead';
  if (catLower.includes('appuntamento')) return 'btn-appuntamenti';
  if (catLower.includes('contratto')) return 'btn-contratti';
  return '';
}
