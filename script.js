const sheetURL = 'https://docs.google.com/spreadsheets/d/e/…/pub?output=tsv';
let data = [], carrello = [];

// Mapping affidabile tra campo nel TSV e ID del select
const filters = [
  { prop: 'Regione', id: 'regioneFilter' },
  { prop: 'Città',   id: 'cittaFilter'   },
  { prop: 'Categoria',id: 'categoriaFilter' },
  { prop: 'Tipo',     id: 'tipoFilter'     },
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
    return Object.fromEntries(headers.map((h,i) => [h.trim(), vals[i]?.trim() || '']));
  });
}

function populateFilters() {
  filters.forEach(({ prop, id }) => {
    const sel = document.getElementById(id);
    // Prima rimuovi eventuali <option> oltre al primo
    sel.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());
    // Prendi i valori unici, ordinati
    const unique = [...new Set(data.map(d => d[prop]))].sort();
    unique.forEach(v => {
      const o = document.createElement('option');
      o.value = o.textContent = v;
      sel.appendChild(o);
    });
  });
  document.querySelectorAll('.filters select')
          .forEach(s => s.addEventListener('change', applyFilters));
}

function resetFilters() {
  filters.forEach(({ id }) => {
    document.getElementById(id).selectedIndex = 0;
  });
  setActiveTab('');
  displayCards(data);
}

function filterByCategoria(cat) {
  setActiveTab(cat);
  displayCards(data.filter(e => e.Categoria === cat));
}

function applyFilters() {
  const criteria = filters.reduce((acc, { prop, id }) => {
    acc[prop] = document.getElementById(id).value;
    return acc;
  }, {});
  setActiveTab('');
  const filtered = data.filter(e =>
    filters.every(({ prop }) =>
      criteria[prop] === prop ||                      // default option e.g. "Categoria"
      criteria[prop] === e[prop]
    )
  );
  displayCards(filtered);
}

function setActiveTab(cat) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  switch(cat) {
    case 'Lead':        document.getElementById('tab-leads').classList.add('active'); break;
    case 'Appuntamento':document.getElementById('tab-appuntamenti').classList.add('active'); break;
    case 'Contratto':   document.getElementById('tab-contratti').classList.add('active'); break;
    default:            document.getElementById('tab-tutti').classList.add('active');
  }
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
  // Apri qui il tuo modal PayPal
}
