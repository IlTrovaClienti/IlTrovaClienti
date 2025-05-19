// script.js
const sheetURL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pubhtml';

let leads = [];
let sectionFilter = 'lead';

document.addEventListener('DOMContentLoaded', () => {
  Tabletop.init({ key: sheetURL, callback: data => {
    leads = data.map((l, i) => ({
      id: i+1,
      regione: l.Regione,
      citta: l.Città,
      categoria: l.Categoria,
      tipo: l.Tipo.toLowerCase(),
      descrizione: l.Descrizione,
      telefono: l.Telefono,
      budget: parseFloat(l['Budget (€)'])
    }));
    populateFilters();
    setupNav();
    setupFilters();
    renderCards();
  }, simpleSheet: true });
});

function populateFilters() {
  const unique = (arr) => [...new Set(arr)].sort();
  const regs = unique(leads.map(l => l.regione));
  const cits = unique(leads.map(l => l.citta));
  const cats = unique(leads.map(l => l.categoria));
  const tys  = unique(leads.map(l => l.tipo));
  const addOpts = (arr, selId) => {
    const sel = document.getElementById(selId);
    arr.forEach(v => sel.appendChild(new Option(v, v)));
  };
  addOpts(regs, 'regione');
  addOpts(cits, 'citta');
  addOpts(cats, 'categoria');
  addOpts(tys, 'tipo');
}

function setupNav() {
  document.getElementById('btnLeads').addEventListener('click', () => { sectionFilter='lead'; toggleNav(); renderCards(); });
  document.getElementById('btnAppuntamenti').addEventListener('click', () => { sectionFilter='appuntamento'; toggleNav(); renderCards(); });
  document.getElementById('btnContratti').addEventListener('click', () => { sectionFilter='contratto'; toggleNav(); renderCards(); });
}

function toggleNav() {
  ['btnLeads','btnAppuntamenti','btnContratti'].forEach(id => document.getElementById(id).classList.remove('selected'));
  const idMap = { 'lead':'btnLeads', 'appuntamento':'btnAppuntamenti', 'contratto':'btnContratti' };
  document.getElementById(idMap[sectionFilter]).classList.add('selected');
}

function setupFilters() {
  ['regione','citta','categoria','tipo'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderCards);
  });
}

function renderCards() {
  const selReg = document.getElementById('regione').value;
  const selCit = document.getElementById('citta').value;
  const selCat = document.getElementById('categoria').value;
  const selTyp = document.getElementById('tipo').value;
  let filtered = leads.filter(l => 
    l.tipo===sectionFilter &&
    (selReg===''||l.regione===selReg) &&
    (selCit===''||l.citta===selCit) &&
    (selCat===''||l.categoria===selCat) &&
    (selTyp===''||l.tipo===selTyp)
  );
  const container = document.getElementById('clienti');
  container.innerHTML = '';
  filtered.forEach(l => {
    const card = document.createElement('div');
    card.className = 'cliente-card '+l.tipo;
    card.innerHTML = `<span class="badge ${l.tipo}">${l.tipo==='lead'?'Lead':'Appuntamento'}</span>
<h3>${l.regione} – ${l.citta}</h3>
<p>${l.descrizione}</p>
<p>Budget: €${l.budget}</p>`;
    container.appendChild(card);
  });
}
