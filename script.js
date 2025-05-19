// script.js

// URL del TSV pubblicato dal tuo Google Sheet
const SHEET_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

let leads = [];
let sectionFilter = 'lead';
let cart = [];

// Al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  fetch(SHEET_TSV)
    .then(res => res.text())
    .then(txt => {
      parseTSV(txt);
      populateFilters();
      render();
    })
    .catch(err => {
      console.error('Impossibile caricare i dati:', err);
      alert('Errore nel caricamento dei dati. Controlla console.');
    });
});

function initUI() {
  document.getElementById('btnLeads')
    .addEventListener('click', () => setSection('lead'));
  document.getElementById('btnAppuntamenti')
    .addEventListener('click', () => setSection('appuntamento'));
  document.getElementById('btnContratti')
    .addEventListener('click', () => setSection('contratto'));

  ['filter-region','filter-city','filter-category','filter-type']
    .forEach(id => {
      document.getElementById(id)
        .addEventListener('change', render);
    });

  document.getElementById('clear-filters')
    .addEventListener('click', () => {
      ['filter-region','filter-city','filter-category','filter-type']
        .forEach(id => document.getElementById(id).value = '');
      render();
    });

  document.getElementById('close-contact')
    .addEventListener('click', () => toggleModal('contact-modal', false));
  document.getElementById('btnContactSend')
    .addEventListener('click', () => {
      alert('Richiesta inviata!');
      toggleModal('contact-modal', false);
    });

  document.getElementById('close-payment')
    .addEventListener('click', () => toggleModal('payment-modal', false));
}

function parseTSV(txt) {
  const lines = txt.trim().split('\n');
  const headers = lines.shift().split('\t').map(h => h.trim().toLowerCase());
  leads = lines.map((line, idx) => {
    const cols = line.split('\t');
    const obj = { id: idx + 1 };
    headers.forEach((h, i) => {
      obj[h] = cols[i]?.trim() || '';
    });
    // Normalizza
    obj.tipo = obj.tipo.toLowerCase();
    obj.budget = parseFloat(obj['budget (€)'] || obj.budget) || 0;
    return obj;
  });
  console.log('Leads caricati:', leads);
}

function populateFilters() {
  const mapping = {
    'regione': 'filter-region',
    'città': 'filter-city',
    'categoria': 'filter-category',
    'tipo': 'filter-type'
  };

  Object.entries(mapping).forEach(([field, selId]) => {
    const select = document.getElementById(selId);
    // elimina le eventuali opzioni precedenti tranne la prima
    select.innerHTML = select.options[0].outerHTML;
    const values = [...new Set(leads.map(l => l[field]))].sort();
    values.forEach(v => {
      if (!v) return;
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
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

  const filtered = leads.filter(l =>
    l.tipo === sectionFilter &&
    (!region   || l.regione === region) &&
    (!city     || l.città === city) &&
    (!category || l.categoria === category) &&
    (!tipo     || l.tipo === tipo)
  );

  if (filtered.length === 0) {
    container.innerHTML = '<p>Nessun risultato</p>';
  }

  filtered.forEach(l => {
    const card = document.createElement('div');
    card.className = 'cliente-card ' + l.tipo;
    card.innerHTML = `
      <span class="badge ${l.tipo}">
        ${l.tipo === 'lead' ? 'Lead da chiamare' :
          l.tipo === 'appuntamento' ? 'Appuntamenti fissati' :
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
  document.getElementById('euro').textContent = `€${cart.length*40}`;
}

function toggleModal(id, show) {
  document.getElementById(id).classList.toggle('visible', show);
}
