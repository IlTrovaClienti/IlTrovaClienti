// URL del foglio TSV pubblicato (OK_5)
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

const elems = {
  regione:        document.getElementById('regione'),
  citta:          document.getElementById('citta'),
  categoria:      document.getElementById('categoria'),
  btnLeads:       document.getElementById('btnLeads'),
  btnAppuntamenti:document.getElementById('btnAppuntamenti'),
  btnContratti:   document.getElementById('btnContratti'),
  clienti:        document.getElementById('clienti'),
  carrello:       document.getElementById('carrello'),
  totale:         document.getElementById('totale'),
  crediti:        document.getElementById('crediti'),
  euro:           document.getElementById('euro'),
  btnCheckout:    document.getElementById('btnCheckout'),
  btnRicarica:    document.getElementById('btnRicarica'),
};

let leads = [];
// Ora filters non include più tipo
let filters = { regione:'', citta:'', categoria:'' };
// Tieni interno solo il filtro via tab
let sectionFilter = 'lead';

// 1) Carica e trasforma il TSV in array di oggetti
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
    setup();
  })
  .catch(err => {
    console.error(err);
    elems.clienti.innerHTML = `<div style="color:red">Errore caricamento dati: ${err.message}</div>`;
  });

// 2) Funzioni di utilità per le icone
function getIconName(cat) {
  cat = (cat||'').toLowerCase();
  if (cat.includes('fotovoltaico')||cat.includes('solare')) return 'fotovoltaico.png';
  if (cat.includes('bagno')) return 'bagno.png';
  if (cat.includes('cucina')) return 'cucina.png';
  if (cat.includes('elettric')||cat.includes('impianto')) return 'impianto-elettrico.png';
  if (cat.includes('idraulic')||cat.includes('acqua')||cat.includes('depurazione')) return 'depurazione-acqua.png';
  if (cat.includes('tinteggi')||cat.includes('pittura')) return 'tinteggiatura.png';
  if (cat.includes('cartongesso')) return 'parete-cartongesso.png';
  if (cat.includes('infissi')||cat.includes('finestr')) return 'infissi-porte.png';
  if (cat.includes('piastrell')||cat.includes('pavimento')) return 'pavimentazione.png';
  if (cat.includes('cappotto')||cat.includes('isolamento')) return 'facciata-cappotto.png';
  if (cat.includes('tetto')) return 'tetto.png';
  if (cat.includes('pratiche')) return 'pratiche-edilizie.png';
  if (cat.includes('giardinaggio')) return 'giardinaggio.png';
  return 'ristrutturazione.png';
}

function getTypeIcon(tipo) {
  switch(tipo) {
    case 'lead':          return 'lead-icon.png';
    case 'appuntamento':  return 'appointment-icon.png';
    case 'contratto':     return 'contract-icon.png';
    default:              return 'lead-icon.png';
  }
}

// 3) Setup iniziale: bottoni tab e filtri
function setup() {
  // Tab
  elems.btnLeads.onclick       = () => { sectionFilter='lead'; render(); };
  elems.btnAppuntamenti.onclick= () => { sectionFilter='appuntamento'; render(); };
  elems.btnContratti.onclick   = () => { sectionFilter='contratto'; render(); };

  // Popola i tre select
  populateFilter(elems.regione,   'regione');
  populateFilter(elems.citta,     'citta');
  populateFilter(elems.categoria, 'categoria');

  // Gestori cambio filtro
  elems.regione.onchange   = () => { filters.regione   = elems.regione.value; render(); };
  elems.citta.onchange     = () => { filters.citta     = elems.citta.value; render(); };
  elems.categoria.onchange = () => { filters.categoria = elems.categoria.value; render(); };

  // Mostra iniziale
  render();
}

function populateFilter(sel, field) {
  const vals = Array.from(new Set(leads.map(l=>l[field]))).sort();
  sel.innerHTML = `<option value="">Tutti</option>` +
    vals.map(v=>`<option value="${v}">${v}</option>`).join('');
}

// 4) Filtra solo su tre campi + tab attivo
function filterLeads() {
  return leads.filter(l =>
    (!filters.regione   || l.regione   === filters.regione) &&
    (!filters.citta     || l.citta     === filters.citta) &&
    (!filters.categoria || l.categoria === filters.categoria) &&
    (l.tipo === sectionFilter)
  );
}

// 5) Render delle card
function render() {
  const list = filterLeads();
  elems.clienti.innerHTML = '';
  list.forEach(l => {
    const iconCat  = getIconName(l.categoria);
    const iconType = getTypeIcon(l.tipo);
    const card = document.createElement('div');
    card.className = 'cliente-card';
    card.innerHTML = `
      <img class="card-icon" src="assets/${iconCat}" alt="${l.categoria}" />
      <img class="card-icon tipo" src="assets/${iconType}" alt="${l.tipo}" />
      <h4>${l.categoria}</h4>
      <p>${l.descrizione}</p>
      <p>Budget: <b>€${l.budget}</b></p>
      <div class="actions">
        <button class="${l.tipo==='contratto'?'riserva':'acquisisci'}">
          ${l.tipo==='contratto'?'Riserva':'Acquisisci'}
        </button>
      </div>
    `;
    elems.clienti.appendChild(card);
  });
}
