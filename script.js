// script.js

const SHEET_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

let leads = [];
let sectionFilter = 'lead';
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
  setupUI();
  fetch(SHEET_TSV)
    .then(r => r.text())
    .then(parseTSV)
    .then(() => {
      // *** Verifica che i dati siano caricati ***
      alert(`🔍 Ho caricato ${leads.length} righe di lead dal foglio.`);
      populateFilters();
      render();
    })
    .catch(err => {
      console.error('Errore fetch/parse:', err);
      alert('⚠️ Errore nel caricamento dei dati. Controlla la console.');
    });
});

function setupUI() {
  document.getElementById('btnLeads').onclick = () => setSection('lead');
  document.getElementById('btnAppuntamenti').onclick = () => setSection('appuntamento');
  document.getElementById('btnContratti').onclick = () => setSection('contratto');

  ['filter-region','filter-city','filter-category','filter-type']
    .forEach(id => document.getElementById(id).addEventListener('change', render));

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
  document.getElementById('pay-paypal').onclick = () => window.open('https://www.paypal.com','_blank');
  document.getElementById('pay-card').onclick   = () => window.open('https://checkout.revolut.com','_blank');
  document.getElementById('pay-bank').onclick   = () => window.location='ricarica.html';
}

function parseTSV(txt) {
  const lines = txt.trim().split('\n');
  const headers = lines.shift().split('\t').map(h => h.trim().toLowerCase());
  leads = lines.map((line, idx) => {
    const cols = line.split('\t');
    const obj = { id: idx + 1 };
    headers.forEach((h, i) => {
      // rimuove eventuale "(€)" nelle intestazioni
      const key = h.replace(/ *\(.+\)/,'');
      obj[key] = cols[i]?.trim() || '';
    });
    obj.tipo = obj.tipo.toLowerCase();
    obj.budget = parseFloat(obj.budget) || 0;
    return obj;
  });
}

function populateFilters() {
  const mapping = [
    ['regione','filter-region'],
    ['città','filter-city'],
    ['categoria','filter-category'],
    ['tipo','filter-type']
  ];
  mapping.forEach(([field, selId]) => {
    const sel = document.getElementById(selId);
    const vals = [...new Set(leads.map(l => l[field]))].sort();
    vals.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v || '—';
      sel.appendChild(opt);
    });
  });
}

function setSection(sec) {
  sectionFilter = sec;
  document.querySelectorAll('.section-buttons .btn').forEach(b => b.classList.remove('selected'));
  const map = { lead: 'btnLeads', appuntamento: 'btnAppuntamenti', contratto: 'btnContratti' };
  document.getElementById(map[sec]).classList.add('selected');
  render();
}

function render() {
  const [r, c, cat, t] = ['filter-region','filter-city','filter-category','filter-type']
    .map(id => document.getElementById(id).value);
  const container = document.getElementById('clienti');
  container.innerHTML = '';

  const filtered = leads.filter(l =>
    l.tipo === sectionFilter &&
    (!r   || l.regione === r) &&
    (!c   || l['città
