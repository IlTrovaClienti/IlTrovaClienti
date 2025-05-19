// script.js

// URL del foglio pubblicato come TSV
const SHEET_TSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

let allLeads = [];
let sectionFilter = 'lead';
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  fetch(SHEET_TSV_URL)
    .then(r => r.text())
    .then(txt => {
      const lines = txt.trim().split('\n');
      const headers = lines.shift().split('\t').map(h => h.trim().toLowerCase());
      allLeads = lines.map((line, i) => {
        const cols = line.split('\t');
        return {
          id: i + 1,
          regione:     cols[headers.indexOf('regione')]      || '',
          città:       cols[headers.indexOf('città')]        || '',
          categoria:   cols[headers.indexOf('categoria')]    || '',
          tipo:        (cols[headers.indexOf('tipo')]       || '').toLowerCase(),
          descrizione: cols[headers.indexOf('descrizione')]  || '',
          telefono:    cols[headers.indexOf('telefono')]     || '',
          budget:      parseFloat(cols[headers.indexOf('budget (€)')] || cols[headers.indexOf('budget')]) || 0
        };
      });
      console.log('Leads caricati:', allLeads.length);
      populateFilters();
      render();
    })
    .catch(err => console.error('Errore caricamento TSV:', err));
});

function setupUI() {
  const btnLeads = document.getElementById('btnLeads');
  const btnApp  = document.getElementById('btnAppuntamenti');
  const btnCon  = document.getElementById('btnContratti');
  if (btnLeads) btnLeads.onclick = () => setSection('lead');
  if (btnApp)   btnApp.onclick   = () => setSection('appuntamento');
  if (btnCon)   btnCon.onclick   = () => setSection('contratto');

  ['filter-region','filter-city','filter-category','filter-type']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.onchange = render;
    });

  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) clearBtn.onclick = () => {
    ['filter-region','filter-city','filter-category','filter-type']
      .forEach(id => document.getElementById(id).value = '');
    render();
  };

  const closeContact = document.getElementById('close-contact');
  const sendContact  = document.getElementById('btnContactSend');
  const closePay     = document.getElementById('close-payment');
  if (closeContact) closeContact.onclick = () => toggleModal('contact-modal', false);
  if (sendContact)  sendContact.onclick  = () => { alert('Richiesta inviata!'); toggleModal('contact-modal', false); };
  if (closePay)     closePay.onclick     = () => toggleModal('payment-modal', false);
}

function populateFilters() {
  const map = {
    regione:   'filter-region',
    città:     'filter-city',
    categoria: 'filter-category',
    tipo:      'filter-type'
  };
  Object.entries(map).forEach(([field, selId]) => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML = `<option value="">Tutti</option>`;
    const vals = [...new Set(allLeads.map(l => l[field]))].filter(v => v).sort();
    vals.forEach(v => sel.add(new Option(v, v)));
  });
}

function setSection(sec) {
  sectionFilter = sec;
  document.querySelectorAll('.section-buttons .btn').forEach(b => b.classList.remove('selected'));
  const map = { lead:'btnLeads', appuntamento:'btnAppuntamenti', contratto:'btnContratti' };
  const el = document.getElementById(map[sec]);
  if (el) el.classList.add('selected');
  render();
}

function render() {
  const r   = document.getElementById('filter-region')?.value;
  const c   = document.getElementById('filter-city')?.value;
  const cat = document.getElementById('filter-category')?.value;
  const t   = document.getElementById('filter-type')?.value;

  const cont = document.getElementById('clienti');
  if (!cont) return;
  cont.innerHTML = '';

  const filtered = allLeads.filter(l =>
    l.tipo === sectionFilter &&
    (!r   || l.regione   === r) &&
    (!c   || l.città     === c) &&
    (!cat || l.categoria === cat) &&
    (!t   || l.tipo      === t)
  );

  if (filtered.length === 0) {
    cont.innerHTML = '<p>Nessun risultato</p>';
    return;
  }

  filtered.forEach(l => {
    const card = document.createElement('div');
    card.className = `cliente-card ${l.tipo}`;
    card.innerHTML = `
      <span class="badge ${l.tipo}">
        ${l.tipo==='lead'?'Lead da chiamare':l.tipo==='appuntamento'?'Appuntamenti fissati':'Contratti riservati'}
      </span>
      <h3>${l.regione} – ${l.città}</h3>
      <div class="desc">${l.descrizione}</div>
      <div class="budget">Budget: €${l.budget}</div>
      <div class="commission">
        Commissione: €${(l.budget/40).toFixed(2)} (${Math.round(l.budget/40)} crediti)
      </div>
      <div class="actions">
        <button class="${l.tipo==='contratto'?'riserva':'acquisisci'} btn">
          ${l.tipo==='contratto'?'Riserva':'Acquisisci'}
        </button>
      </div>`;

    const buyBtn = card.querySelector('.acquisisci');
    const resBtn = card.querySelector('.riserva');
    if (buyBtn) buyBtn.onclick = () => { cart.push(l); updateCart(); toggleModal('payment-modal', true); };
    if (resBtn) resBtn.onclick = () => toggleModal('contact-modal', true);

    cont.appendChild(card);
  });

  updateCart();
}

function updateCart() {
  const list = document.getElementById('carrello');
  if (list) {
    list.innerHTML = cart.map(i => `<li>${i.descrizione} – €${i.budget}</li>`).join('');
  }
  const sum = cart.reduce((s,i) => s + i.budget, 0);
  const tot = document.getElementById('totale');
  const cred = document.getElementById('crediti');
  const euro = document.getElementById('euro');
  if (tot) tot.textContent = `Totale: €${sum}`;
  if (cred) cred.textContent = cart.length;
  if (euro) euro.textContent = `€${cart.length * 40}`;
}

function toggleModal(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('visible', show);
}
