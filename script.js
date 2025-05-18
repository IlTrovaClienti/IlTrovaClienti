// Constants
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
const EUR_PER_CREDIT = 40;
let userCredits = 0;
let leadsData = [];
let cart = [];
let currentTab = 'Lead';
const filters = { Regione: '', Città: '', Categoria: '', Tipo: '' };

document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  initEventListeners();
});

function fetchData() {
  fetch(SHEET_URL)
    .then(res => res.text())
    .then(text => {
      const rows = text.trim().split('\n').map(r => r.split('\t'));
      const headers = rows.shift();
      leadsData = rows.map(cols => Object.fromEntries(cols.map((c,i) => [headers[i], c])));
      initFilters();
      renderCards();
    });
}

function initEventListeners() {
  // Tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCards();
    });
  });
  // Filter selects
  ['Regione', 'Città', 'Categoria', 'Tipo'].forEach(key => {
    document.getElementById(`filter-${key.toLowerCase()}`).addEventListener('change', e => {
      filters[key] = e.target.value;
      if (key === 'Regione') updateDependentFilters();
      renderCards();
    });
  });
  // Checkout
  document.getElementById('checkout').addEventListener('click', () => showPaymentInfo());
}

function initFilters() {
  const regions = getUnique('Regione');
  populateSelect('filter-region', regions);
  updateDependentFilters();
}

function updateDependentFilters() {
  ['Città', 'Categoria', 'Tipo'].forEach(key => {
    const filtered = leadsData
      .filter(d => !filters.Regione || d.Regione === filters.Regione)
      .map(d => d[key]);
    populateSelect(`filter-${key.toLowerCase()}`, [...new Set(filtered)]);
  });
}

function populateSelect(id, items) {
  const sel = document.getElementById(id);
  sel.innerHTML = `<option value="">Tutti</option>` + items.map(i => `<option value="${i}">${i}</option>`).join('');
}

function renderCards() {
  const container = document.getElementById('cards');
  container.innerHTML = '';
  let data = leadsData.filter(d => applyAllFilters(d));
  if (currentTab !== 'Tutti') {
    const tipoMap = { Appuntamento: 'Appuntamento', Contratto: 'Contratto', Lead: 'Lead' };
    data = data.filter(d => d.Tipo === tipoMap[currentTab] || (currentTab==='Lead' && d.Tipo==='Lead'));
  }
  data.forEach(d => {
    const cost = parseInt(d['Costo (crediti)'], 10);
    const card = document.createElement('div');
    card.className = `card ${getColorClass(d.Tipo)}`;
    card.innerHTML = `
      <div>
        <h3>${d.Descrizione}</h3>
        <p>${d.Città}, ${d.Regione}</p>
        <p>Budget: €${d['Budget (€)']} - ${cost} crediti</p>
      </div>
      <button class="round-button" onclick="addToCart(${cost})">
${d.Tipo === 'Contratto' ? 'Riserva' : `Acquisisci (+${cost})`}</button>
    `;
    container.appendChild(card);
  });
  updateCartUI();
}

function applyAllFilters(d) {
  return Object.keys(filters).every(key => !filters[key] || d[key] === filters[key]);
}

function getUnique(key) {
  return [...new Set(leadsData.map(d => d[key]))];
}

function getColorClass(type) {
  switch(type) {
    case 'Lead': return 'blue';
    case 'Appuntamento': return 'fuchsia';
    case 'Contratto': return 'yellow';
    default: return 'green';
  }
}

function addToCart(cred) {
  cart.push(cred);
  userCredits += cred;
  updateCartUI();
}

function removeFromCart(index) {
  userCredits -= cart[index];
  cart.splice(index,1);
  updateCartUI();
}

function updateCartUI() {
  const list = document.getElementById('cart-items'); list.innerHTML = '';
  cart.forEach((c,i) => list.innerHTML += `<li>+${c} crediti <button onclick="removeFromCart(${i})">×</button></li>`);
  document.getElementById('cart-total').innerText = `Totale: ${userCredits} crediti (€${userCredits*EUR_PER_CREDIT})`;
}

function showPaymentInfo() {
  alert(`Per pagare ${userCredits} crediti (totale €${userCredits*EUR_PER_CREDIT}):
IBAN: LT67 3250 0328 0923 7250 (Revolut Bank UAB)
BIC: REVOLT21

Oppure usa PayPal tramite il pulsante.`);
}

// PayPal
paypal.Buttons({
  createOrder: (data,actions) => actions.order.create({ purchase_units:[{ amount:{ value:(userCredits*EUR_PER_CREDIT).toString() } }] }),
  onApprove: (data,actions)=> actions.order.capture().then(details => alert('Pagamento completato da '+details.payer.name.given_name))
}).render('#paypal-button-container');
