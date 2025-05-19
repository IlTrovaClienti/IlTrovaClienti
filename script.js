// script.js

const SHEET_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

let leads = [];
let sectionFilter = 'lead';
let cart = [];

// Inizializza UI e dati
document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  fetch(SHEET_TSV)
    .then(r => r.text())
    .then(parseTSV)
    .then(() => {
      populateFilters();
      render();
    })
    .catch(console.error);
});

function setupUI() {
  // Sezioni
  document.getElementById('btnLeads')
    .addEventListener('click', () => setSection('lead'));
  document.getElementById('btnAppuntamenti')
    .addEventListener('click', () => setSection('appuntamento'));
  document.getElementById('btnContratti')
    .addEventListener('click', () => setSection('contratto'));

  // Filtri
  ['filter-region','filter-city','filter-category','filter-type']
    .forEach(id => document.getElementById(id)
      .addEventListener('change', render));

  document.getElementById('clear-filters')
    .addEventListener('click', () => {
      ['filter-region','filter-city','filter-category','filter-type']
        .forEach(id => document.getElementById(id).value = '');
      render();
    });

  // Modal Contatto
  document.getElementById('close-contact')
    .addEventListener('click', () => toggleModal('contact-modal', false));
  document.getElementById('btnContactSend')
    .addEventListener('click', () => {
      alert('Richiesta inviata!');
      toggleModal('contact-modal', false);
    });

  // Modal Payment
  document.getElementById('close-payment')
    .addEventListener('click', () => toggleModal('payment-modal', false));
}

function parseTSV(txt) {
  const lines = txt.trim().split('\n');
  const headers = lines.shift().split('\t').map(h => h.trim().toLowerCase());
  leads = lines.map((line, idx) => {
    const cols = line.split('\t');
    const obj = { id: idx+1 };
    headers.forEach((h, i) => {
      let key = h.replace(/ *\(.+\)/, ''); // rimuove "(€)" ecc.
      obj[key] = cols[i]?.trim() || '';
    });
    // Normalizza types (lead|appuntamento|contratto)
    obj.tipo = obj.tipo.toLowerCase();
    // budget come numero
    obj.budget = parseFloat(obj.budget) || 0;
    return obj;
  });
}

function populateFilters() {
  const fields = [
    ['regione','filter-region'],
    ['città','filter-city'],
    ['categoria','filter-category'],
    ['tipo','filter-type']
  ];
  fields.forEach(([field, selId]) => {
    const sel = document.getElementById(selId);
    // pratichi i valori unici
    const vals = [...new Set(leads.map(l => l[field]))].sort();
    vals.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v.charAt(0).toUpperCase() + v.slice(1);
      sel.appendChild(opt);
    });
  });
}

function setSection(sec) {
  sectionFilter = sec;
  document.querySelectorAll('.section-buttons .btn')
    .forEach(b => b.classList.remove('selected'));
  const idMap = { lead: 'btnLeads', appuntamento: 'btnAppuntamenti', contratto: 'btnContratti' };
  document.getElementById(idMap[sec]).classList.add('selected');
  render();
}

function render() {
  const [r, c, cat, t] = ['filter-region','filter-city','filter-category','filter-type']
    .map(id => document.getElementById(id).value);
  const container = document.getElementById('clienti');
  container.innerHTML = '';

  // filtra
  const filtered = leads.filter(l =>
    l.tipo === sectionFilter &&
    (!r || l.regione === r) &&
    (!c || l.città === c) &&
    (!cat || l.categoria === cat) &&
    (!t || l.tipo === t)
  );

  // crea card
  filtered.forEach(l => {
    const card = document.createElement('div');
    card.className = `cliente-card ${l.tipo}`;
    card.innerHTML = `
      <span class="badge ${l.tipo}">
        ${l.tipo==='lead'?'Lead da chiamare':l.tipo==='appuntamento'?'Appuntamenti':'Contratti'}
      </span>
      <h3>${l.regione} – ${l.città}</h3>
      <div class="desc">${l.descrizione}</div>
      <div class="budget">Budget: €${l.budget}</div>
      <div class="commission">
        Commissione: €${(l.budget/40).toFixed(2)} (${(l.budget/40).toFixed(0)} crediti)
      </div>
      <div class="actions">
        <button class="${l.tipo==='contratto'?'riserva':'acquisisci'} btn">
          ${l.tipo==='contratto'?'Riserva':'Acquisisci'}
        </button>
      </div>`;
    // eventi
    card.querySelector('.acquisisci')?.addEventListener('click', () => {
      cart.push(l);
      updateCart();
      toggleModal('payment-modal', true);
    });
    card.querySelector('.riserva')?.addEventListener('click', () => {
      toggleModal('contact-modal', true);
    });
    container.appendChild(card);
  });

  updateCart();
}

function updateCart() {
  const list = document.getElementById('carrello');
  list.innerHTML = cart.map(i => `<li>${i.descrizione} – €${i.budget}</li>`).join('');
  const sum = cart.reduce((s,i) => s + i.budget, 0);
  document.getElementById('totale').textContent = `Totale: €${sum}`;
  document.getElementById('crediti').textContent = cart.length;
  document.getElementById('euro').textContent = `€${(cart.length*40)}`;
}

function toggleModal(id, show) {
  document.getElementById(id).classList.toggle('visible', show);
}
