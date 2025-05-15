let rawData = [];
const tsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv&t=' + Date.now();

fetch(tsvUrl)
  .then(res => res.text())
  .then(data => {
    parseTSV(data);
    populateFilters();
    applyFilters();
  });

function parseTSV(data) {
  const rows = data.trim().split('\n');
  const headers = rows.shift().split('\t');
  rawData = rows.map(row => {
    const cols = row.split('\t');
    return headers.reduce((obj, header, i) => (obj[header] = cols[i], obj), {});
  });
}

function populateFilters() {
  const filters = ["Regione", "Città", "Categoria", "Tipo"];
  filters.forEach(filter => {
    const select = document.getElementById(filter.toLowerCase() + "Filter");
    const options = ["Tutte", ...new Set(rawData.map(item => item[filter]))];
    select.innerHTML = options.map(opt => `<option>${opt}</option>`).join('');
    select.onchange = applyFilters;
  });

  document.querySelector('.reset-filters-btn').onclick = () => {
    document.querySelectorAll('.filters-container select').forEach(sel => sel.selectedIndex = 0);
    applyFilters();
  };
}

function applyFilters() {
  const [regione, città, categoria, tipo] = ["regione", "città", "categoria", "tipo"]
    .map(f => document.getElementById(f + "Filter").value);

  const filteredData = rawData.filter(row =>
    (regione === "Tutte" || row.Regione === regione) &&
    (città === "Tutte" || row.Città === città) &&
    (categoria === "Tutte" || row.Categoria === categoria) &&
    (tipo === "Tutte" || row.Tipo === tipo)
  );

  renderCards(filteredData);
}

function renderCards(data) {
  const container = document.getElementById('cards-container');
  container.innerHTML = data.map(row => `
    <div class="card">
      <h3>${row.Categoria}</h3>
      <p>${row.Descrizione}</p>
      <p><strong>Città:</strong> ${row.Città}</p>
      <p><strong>Budget:</strong> €${row["Budget (€)"]}</p>
      <button class="action-btn ${row.Tipo.toLowerCase()}">Acquista (${row["Costo (crediti)"]} crediti)</button>
      <button class="cancel-btn">Annulla</button>
    </div>
  `).join('');
}
