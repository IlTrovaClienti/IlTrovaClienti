// script.js

// ➤ Il tuo Google Sheet in formato TSV
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
      // Prendo l’header raw e lo normalizzo (rimuovo accenti e metto minuscolo)
      const rawHeaders = lines.shift().split('\t');
      const headers = rawHeaders.map(h =>
        h
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // rimuove gli accenti
          .trim()
          .toLowerCase()
      );

      // Mappo ogni riga in un oggetto dinamico { header: valore, ... }
      allLeads = lines.map((line, i) => {
        const cols = line.split('\t');
        const row = {};
        headers.forEach((h, idx) => row[h] = cols[idx] || '');

        return {
          id: i + 1,
          regione:    row['regione'] || '',
          citta:      row['citta']   || '',  // ora 'citta' senza accento
          categoria:  row['categoria'] || '',
          tipo:       (row['tipo'] || '').toLowerCase(),
          descrizione:row['descrizione'] || '',
          telefono:   row['telefono'] || '',
          budget:     parseFloat(row['budget (€)'] || row['budget'] || '0') || 0
        };
      });

      console.log('Leads caricati:', allLeads.length);
      populateFilters();
      render();
    })
    .catch(err => console.error('Errore caricamento TSV:', err));
});


function setupUI() {
  document.getElementById('btnLeads')?.addEventListener('click', () => setSection('lead'));
  document.getElementById('btnAppuntamenti')?.addEventListener('click', () => setSection('appuntamento'));
  document.getElementById('btnContratti')?.addEventListener('click', () => setSection('contratto'));

  ['filter-region','filter-city','filter-category','filter-type']
    .forEach(id => document.getElementById(id)?.addEventListener('change', render));

  document.getElementById('clear-filters')?.addEventListener('click', () => {
    ['filter-region','filter-city','filter-category','filter-type']
      .forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    render();
  });

  document.getElementById('close-contact')?.addEventListener('click', () =>
    toggleModal('contact-modal', false)
  );
  document.getElementById('btnContactSend')?.addEventListener('click', () => {
    alert('Richiesta inviata!');
    toggleModal('contact-modal', false);
  });
  document.getElementById('close-payment')?.addEventListener('click', () =>
    toggleModal('payment-modal', false)
  );
}

function populateFilters() {
  const map = {
    regione:   'filter-region',
    citta:     'filter-city',      // qui uso 'citta' senza accento
    categoria: 'filter-category',
    tipo:      'filter-type'
  };

  Object.entries(map).forEach(([field, selId]) => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML = `<option value="">Tutti</option>`;
    const vals = [...new Set(allLeads.map(l => l[field]))]
      .filter(v => v)
      .sort();
    vals.forEach(v => sel.add(new Option(v, v)));
  });
}

function setSection(sec) {
  sectionFilter = sec;
  document.querySelectorAll('.section-buttons .btn').forEach(b => b.classList.remove('selected'));
  const idMap = { lead:'btnLeads', appuntamento:'btnAppuntamenti', contratto:'btnContratti' };
  document.getElementById(idMap[sec])?.classList.add('selected');
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
    (!c   || l.citta     === c) &&
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
      <h3>${l.regione} – ${l.citta}</h3>
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

    card.querySelector('.acquisisci')?.addEventListener('click', () => {
      cart.push(l);
      updateCart();
      toggleModal('payment-modal', true);
    });
    card.querySelector('.riserva')?.addEventListener('click', () =>
      toggleModal('contact-modal', true)
    );

    cont.appendChild(card);
  });

  updateCart();
}

function updateCart() {
  document.getElementById('carrello').innerHTML =
    cart.map(i => `<li>${i.descrizione} – €${i.budget}</li>`).join('');

  const sum = cart.reduce((s,i) => s + i.budget, 0);
  document.getElementById('totale')?.textContent = `Totale: €${sum}`;
  document.getElementById('crediti')?.textContent = cart.length;
  document.getElementById('euro')?.textContent    = `€${cart.length * 40}`;
}

function toggleModal(id, show) {
  document.getElementById(id)?.classList.toggle('visible', show);
}
