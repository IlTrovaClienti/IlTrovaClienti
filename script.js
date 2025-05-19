// URL Google Sheet pubblicato TSV
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/…/pub?output=tsv';

const elems = {
  regione: document.getElementById('regione'),
  citta: document.getElementById('citta'),
  categoria: document.getElementById('categoria'),
  tipo: document.getElementById('tipo'),
  btnLeads: document.getElementById('btnLeads'),
  btnAppuntamenti: document.getElementById('btnAppuntamenti'),
  btnContratti: document.getElementById('btnContratti'),
  clienti: document.getElementById('clienti'),
  carrello: document.getElementById('carrello'),
  totale: document.getElementById('totale'),
  creditiDisp: document.getElementById('crediti'),
  euroDisp: document.getElementById('euro'),
  authModal: document.getElementById('auth-modal'),
  contactModal: document.getElementById('contact-modal'),
  // … altri elementi come prima …
};

let leads = [], sectionFilter = 'lead', cart = [];

// Toggle tab buttons
elems.btnLeads.onclick = ()=>{ sectionFilter='lead'; render(); };
// … setup onclick per appuntamenti e contratti …

// Fetch TSV
fetch(sheetURL)
  .then(r=>r.text())
  .then(txt=>{
    const lines = txt.trim().split('\n');
    const headers = lines.shift().split('\t').map(h=>h.trim().toLowerCase());
    leads = lines.map((l,i)=>{
      const cols = l.split('\t');
      return {
        id: i+1,
        regione: cols[headers.indexOf('regione')],
        citta: cols[headers.indexOf('città')],
        categoria: cols[headers.indexOf('categoria')],
        tipo: cols[headers.indexOf('tipo')],
        descrizione: cols[headers.indexOf('descrizione')],
        budget: parseFloat(cols[headers.indexOf('budget (€)')])
      };
    });
    render();
  });

// Render function
function render(){
  elems.clienti.innerHTML = '';
  const filtered = leads.filter(l => l.tipo === sectionFilter || sectionFilter==='tutti');
  filtered.forEach(l=>{
    const card = document.createElement('div');
    card.className = 'cliente-card ' + l.tipo;
    card.innerHTML = `
      <span class="badge ${l.tipo}">${l.tipo}</span>
      <h3>${l.regione} – ${l.citta}</h3>
      <div class="desc">${l.descrizione}</div>
      <div class="budget">Budget: €${l.budget}</div>
      <div class="commission">Commissione: €${l.budget/40}</div>
      <div class="actions">
        <button data-id="${l.id}" class="acquire">Acquisisci</button>
      </div>`;
    elems.clienti.appendChild(card);
  });
  // carrello, totale e crediti…
}

// … resto del codice per auth, cart, modali …
