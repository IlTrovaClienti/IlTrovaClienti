// URL TSV pubblicato
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

const elems = {
  regione:   document.getElementById('regione'),
  citta:     document.getElementById('citta'),
  categoria: document.getElementById('categoria'),
  clienti:   document.getElementById('clienti'),
  carrello:  document.getElementById('carrello'),
  totale:    document.getElementById('totale'),
  crediti:   document.getElementById('crediti'),
  euro:      document.getElementById('euro'),
};

let leads = [];
let cart = [];
let filters = { regione:'', citta:'', categoria:'' };  // tolto 'tipo'

fetch(sheetURL)
  .then(res => {
    if (!res.ok) throw new Error('Sheet non trovato: ' + res.status);
    return res.text();
  })
  .then(tsv => {
    const lines = tsv.trim().split('\n');
    const headers = lines.shift().split('\t');
    leads = lines.map(line => {
      const cols = line.split('\t');
      const obj = {};
      headers.forEach((h,i) => obj[h] = cols[i]);
      return obj;
    });
    init();
  })
  .catch(err => {
    console.error(err);
    elems.clienti.innerHTML = `<div style="color:red">Errore caricamento dati: ${err.message}</div>`;
  });

function getIconName(cat) {
  cat = (cat||'').toLowerCase();
  if (cat.includes('fotovoltaico') || cat.includes('solare')) return 'fotovoltaico.png';
  if (cat.includes('bagno')) return 'bagno.png';
  if (cat.includes('cucina')) return 'cucina.png';
  if (cat.includes('elettric') || cat.includes('impianto')) return 'impianto-elettrico.png';
  if (cat.includes('idraulic') || cat.includes('acqua') || cat.includes('depurazione')) return 'depurazione-acqua.png';
  if (cat.includes('tinteggi') || cat.includes('pittura')) return 'tinteggiatura.png';
  if (cat.includes('cartongesso')) return 'parete-cartongesso.png';
  if (cat.includes('infissi') || cat.includes('finestr')) return 'infissi-porte.png';
  if (cat.includes('piastrell') || cat.includes('pavimento')) return 'pavimentazione.png';
  if (cat.includes('cappotto') || cat.includes('isolamento')) return 'facciata-cappotto.png';
  if (cat.includes('tetto')) return 'tetto.png';
  if (cat.includes('pratiche')) return 'pratiche-edilizie.png';
  if (cat.includes('giardinaggio')) return 'giardinaggio.png';
  return 'ristrutturazione.png';
}

// opzionale: funzione getTypeIcon se usi anche icona di tipo

function init() {
  // popola filtri regione, città, categoria...
  elems.regione.addEventListener('change', e => { filters.regione = e.target.value; render(); });
  elems.citta.addEventListener('change',   e => { filters.citta   = e.target.value; render(); });
  elems.categoria.addEventListener('change', e => { filters.categoria = e.target.value; render(); });
  render();
}

function filterLeads() {
  return leads.filter(l =>
    (!filters.regione   || l.regione   === filters.regione) &&
    (!filters.citta     || l.citta     === filters.citta) &&
    (!filters.categoria || l.categoria === filters.categoria)
  );
}

function render() {
  const filtered = filterLeads();
  elems.clienti.innerHTML = '';
  filtered.forEach(l => {
    const icon = getIconName(l.categoria);
    const card = document.createElement('div');
    card.className = 'cliente-card';
    card.innerHTML = `
      <img class="card-icon" src="assets/${icon}" alt="${l.categoria}" />
      <div class="tipo">${l.categoria}</div>
      <div class="desc">${l.descrizione}</div>
      <div class="budget">Budget: <b>€${l.budget}</b></div>
      <div class="commission">Commissione: ${l.tipo==='lead'? '1 credito' : l.tipo==='appuntamento'? '2 crediti' : 'Riservato'}</div>
      <div class="actions">
        <button class="${l.tipo==='contratto'?'riserva':'acquisisci'}" data-id="${l.id}">
          ${l.tipo==='contratto'?'Riserva':'Acquisisci'}
        </button>
      </div>`;
    elems.clienti.appendChild(card);
  });
}
