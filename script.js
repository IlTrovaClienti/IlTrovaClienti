// script.js

const SHEET_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let allLeads = [];

// Inizializza tutto quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  loadLeads();
  setupFilters();
  setupModals();
  setupAuthButtons();
});

// 1) Carica e renderizza i lead
function loadLeads() {
  fetch(SHEET_TSV)
    .then(r => r.text())
    .then(txt => {
      const lines = txt.trim().split('\n');
      const headers = lines.shift().split('\t');
      allLeads = lines.map(l => {
        const cols = l.split('\t');
        const item = {};
        headers.forEach((h,i) => item[h] = cols[i]);
        return item;
      });
      populateFilters(allLeads);
      renderLeads(allLeads);
    })
    .catch(e => console.error('Errore caricamento dati:', e));
}

// 2) Popola i select di filtro
function populateFilters(data) {
  const unique = (field) => [...new Set(data.map(x => x[field]))].sort();
  const addOpts = (arr, id) => {
    const sel = document.getElementById(id);
    arr.forEach(v => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      sel.appendChild(o);
    });
  };
  addOpts(unique('Regione'), 'filter-region');
  addOpts(unique('Città'),   'filter-city');
  addOpts(unique('Categoria'),'filter-category');
  addOpts(unique('Tipo'),     'filter-type');
}

// 3) Filtro e render
function setupFilters() {
  ['filter-region','filter-city','filter-category','filter-type']
    .forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
  document.getElementById('clear-filters').addEventListener('click', () => {
    ['filter-region','filter-city','filter-category','filter-type']
      .forEach(id => document.getElementById(id).value = '');
    renderLeads(allLeads);
  });
}

function applyFilters() {
  const r = document.getElementById('filter-region').value;
  const c = document.getElementById('filter-city').value;
  const cat = document.getElementById('filter-category').value;
  const t = document.getElementById('filter-type').value;
  const filtered = allLeads.filter(x =>
    (!r || x.Regione === r) &&
    (!c || x.Città === c) &&
    (!cat || x.Categoria === cat) &&
    (!t || x.Tipo === t)
  );
  renderLeads(filtered);
}

function renderLeads(leads) {
  const container = document.getElementById('leads-container');
  container.innerHTML = '';
  leads.forEach(l => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${l.Titolo}</h3>
      <p>${l.Descrizione}</p>
      <p><strong>Budget:</strong> €${l.Budget}</p>
      <button class="btn open-contact-modal">Richiedi Contatto</button>
      <button class="btn open-checkout-modal">Riserva</button>
    `;
    container.appendChild(card);
  });
  document.querySelectorAll('.open-contact-modal')
    .forEach(b => b.addEventListener('click', () => toggleModal('contact-modal', true)));
  document.querySelectorAll('.open-checkout-modal')
    .forEach(b => b.addEventListener('click', () => toggleModal('checkout-modal', true)));
}

// 4) Modali
function setupModals() {
  document.getElementById('close-contact-modal')
    .addEventListener('click', () => toggleModal('contact-modal', false));
  document.getElementById('close-checkout')
    .addEventListener('click', () => toggleModal('checkout-modal', false));
  document.getElementById('pay-now')
    .addEventListener('click', () => {
      const m = document.querySelector('input[name="payment"]:checked');
      if (!m) return alert('Seleziona un metodo');
      alert('Pagato con ' + m.value);
      toggleModal('checkout-modal', false);
    });
}

function toggleModal(id, show) {
  document.getElementById(id).classList.toggle('visible', show);
}

// 5) Pulsanti Auth
function setupAuthButtons() {
  const loginB = document.getElementById('login-button');
  const regB   = document.getElementById('register-button');
  const outB   = document.getElementById('logout-button');

  loginB.addEventListener('click', () => toggleModal('auth-modal', true));
  regB  .addEventListener('click', () => toggleModal('auth-modal', true));
  outB  .addEventListener('click', () => firebase.auth().signOut());

  // Gestione stato utente
  firebase.auth().onAuthStateChanged(u => {
    const logged = !!u;
    loginB.style.display    = logged ? 'none' : '';
    regB.style.display      = logged ? 'none' : '';
    outB.style.display      = logged ? '' : 'none';
  });
}
