// URL TSV Pubblico del tuo foglio
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

let allLeads = [], sectionFilter = 'lead', cart = [];

document.addEventListener('DOMContentLoaded', () => {
  setupUI();

  fetch(SHEET_URL)
    .then(r => r.text())
    .then(txt => {
      const lines = txt.trim().split('\n');
      // Intestazioni normalizzate (rimuovo accenti)
      const headers = lines.shift().split('\t').map(h =>
        h.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      );

      allLeads = lines.map((l, i) => {
        const cols = l.split('\t'), obj = {};
        headers.forEach((h, idx) => obj[h] = cols[idx] || '');
        return {
          id: i+1,
          regione:    obj['regione'] || '',
          citta:      obj['citta']   || '',
          categoria:  obj['categoria']|| '',
          tipo:       (obj['tipo']||'').toLowerCase(),
          descrizione:obj['descrizione']|| '',
          budget:     parseFloat(obj['budget (€)']||obj['budget']||'0')||0
        };
      });

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
      .forEach(id => document.getElementById(id).value = '');
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
    citta:     'filter-city',
    categoria: 'filter-category',
    tipo:      'filter-type'
  };

  Object.entries(map).forEach(([field, selId]) => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Tutti</option>';
    [...new Set(allLeads.map(l => l[field]))]
      .filter(v => v)
      .sort()
      .forEach(v => sel.add(new Option(v, v)));
  });
}

function setSection(sec) {
  sectionFilter = sec;
  document.querySelectorAll('.section-buttons .btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('btn' + sec.charAt(0).toUpperCase() + sec.slice(1))?.classList.add('selected');
  render();
}

function render() {
  const r   = document.getElementById('filter-region')?.value;
  const c   = document.getElementById('filter-city')?.value;
  const cat = document.getElementById('filter-category')?.value;
  const t   = document.getElementById('filter-type')?.value;
  const cont = document.getElementById('clienti');
  cont.innerHTML = '';

  const filtered = allLeads.filter(l =>
    l.tipo === sectionFilter &&
    (!r   || l.regione   === r) &&
    (!c   || l.citta     === c) &&
    (!cat || l.categoria === cat) &&
    (!t   || l.tipo      === t)
  );

  if (!filtered.length) {
    cont.innerHTML = '<p>Nessun risultato</p>';
    return;
  }

  filtered.forEach(l => {
    const card = document.createElement('div');
    card.className = 'cliente-card ' + l.tipo;
    card.innerHTML = `
      <span class="badge ${l.tipo}">
        ${l.tipo==='lead'?'Lead da chiamare':l.tipo==='appuntamento'?'Appuntamenti fissati':'Contratti riservati'}
      </span>
      <h3>${l.regione} – ${l.citta}</h3>
      <div class="desc">${l.descrizione}</div>
      <div class="budget">Budget: €${l.budget}</div>
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
  const sum = cart.reduce((s, i) => s + i.budget, 0);
  document.getElementById('totale').textContent = `Totale: €${sum}`;
  document.getElementById('crediti').textContent = cart.length;
  document.getElementById('euro').textContent    = `€${cart.length * 40}`;
}

function toggleModal(id, show) {
  document.getElementById(id)?.classList.toggle('visible', show);
}
