// script.js

// Chiave del tuo Google Sheet (pubblicato come “pubhtml”)
const SHEET_KEY = '2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy';

let allLeads = [];
let sectionFilter = 'lead';
let cart = [];

// Al caricamento del DOM, inizializza UI e carica i dati via Tabletop
document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  Tabletop.init({
    key: SHEET_KEY,
    simpleSheet: true,
    callback: data => {
      allLeads = data.map((row, i) => ({
        id: i + 1,
        regione: row.Regione || '',
        città: row.Città || '',
        categoria: row.Categoria || '',
        tipo: (row.Tipo || '').toLowerCase(),
        descrizione: row.Descrizione || '',
        telefono: row.Telefono || '',
        budget: parseFloat(row['Budget (€)'] || row.Budget) || 0
      }));
      populateFilters();
      render();
    }
  });
});

function setupUI() {
  document.getElementById('btnLeads').onclick         = () => setSection('lead');
  document.getElementById('btnAppuntamenti').onclick = () => setSection('appuntamento');
  document.getElementById('btnContratti').onclick    = () => setSection('contratto');

  ['filter-region','filter-city','filter-category','filter-type']
    .forEach(id => {
      document.getElementById(id).onchange = render;
    });

  document.getElementById('clear-filters').onclick = () => {
    ['filter-region','filter-city','filter-category','filter-type']
      .forEach(id => document.getElementById(id).value = '');
    render();
  };

  document.getElementById('close-contact').onclick = () => toggleModal('contact-modal', false);
  document.getElementById('btnContactSend').onclick = () => {
    alert('Richiesta inviata!');
    toggleModal('contact-modal', false);
  };

  document.getElementById('close-payment').onclick = () => toggleModal('payment-modal', false);
}

function populateFilters() {
  const map = {
    regione: 'filter-region',
    città:    'filter-city',
    categoria:'filter-category',
    tipo:     'filter-type'
  };

  Object.entries(map).forEach(([field, selId]) => {
    const sel = document.getElementById(selId);
    // reset solo l'opzione default
    sel.innerHTML = `<option value="">Tutti</option>`;

    const values = [...new Set(allLeads.map(l => l[field]))]
      .filter(v => v)
      .sort();

    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value       = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
  });
}

function setSection(sec) {
  sectionFilter = sec;
  document.querySelectorAll('.section-buttons .btn')
    .forEach(b => b.classList.remove('selected'));

  const idMap = {
    lead: 'btnLeads',
    appuntamento: 'btnAppuntamenti',
    contratto: 'btnContratti'
  };
  document.getElementById(idMap[sec]).classList.add('selected');
  render();
}

function render() {
  const region   = document.getElementById('filter-region').value;
  const city     = document.getElementById('filter-city').value;
  const category = document.getElementById('filter-category').value;
  const tipo     = document.getElementById('filter-type').value;

  const container = document.getElementById('clienti');
  container.innerHTML = '';

  const filtered = allLeads.filter(l =>
    l.tipo === sectionFilter &&
    (!region   || l.regione   === region) &&
    (!city     || l.città     === city) &&
    (!category || l.categoria === category) &&
    (!tipo     || l.tipo      === tipo)
  );

  if (filtered.length === 0) {
    container.innerHTML = '<p>Nessun risultato</p>';
    return;
  }

  filtered.forEach(l => {
    const card = document.createElement('div');
    card.className = `cliente-card ${l.tipo}`;
    card.innerHTML = `
      <span class="badge ${l.tipo}">
        ${l.tipo==='lead' ? 'Lead da chiamare' :
          l.tipo==='appuntamento' ? 'Appuntamenti fissati' :
          'Contratti riservati'}
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
      </div>
    `;
    const btnAcquire = card.querySelector('.acquisisci');
    const btnReserve = card.querySelector('.riserva');

    if (btnAcquire) {
      btnAcquire.onclick = () => {
        cart.push(l);
        updateCart();
        toggleModal('payment-modal', true);
      };
    }
    if (btnReserve) {
      btnReserve.onclick = () => toggleModal('contact-modal', true);
    }

    container.appendChild(card);
  });

  updateCart();
}

function updateCart() {
  const list = document.getElementById('carrello');
  list.innerHTML = cart.map(i =>
    `<li>${i.descrizione} – €${i.budget}</li>`
  ).join('');

  const sum = cart.reduce((s,i) => s + i.budget, 0);
  document.getElementById('totale').textContent = `Totale: €${sum}`;
  document.getElementById('crediti').textContent = cart.length;
  document.getElementById('euro').textContent    = `€${cart.length * 40}`;
}

function toggleModal(id, show) {
  document.getElementById(id).classList.toggle('visible', show);
}
