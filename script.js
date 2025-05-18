// Constants
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
const EUR_PER_CREDIT = 40;
let userCredits = 0;
let leadsData = [];
let cart = [];

// Load TSV data
fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const rows = text.trim().split('\n').map(r => r.split('\t'));
    const headers = rows.shift();
    leadsData = rows.map(cols => Object.fromEntries(cols.map((c, i) => [headers[i], c])));
    initFilters();
    renderCards('Tutti');
  });

// Initialize filters
function initFilters() {
  const regions = [...new Set(leadsData.map(d => d['Regione']))];
  populateSelect('filter-region', regions);
  // similarly for city, category, type
}

function populateSelect(id, items) {
  const sel = document.getElementById(id);
  sel.innerHTML = '<option value="">Tutti</option>' + items.map(i => `<option value="${i}">${i}</option>`).join('');
}

// Render cards
function renderCards(tab) {
  const container = document.getElementById('cards');
  container.innerHTML = '';
  const filtered = leadsData.filter(d => applyFilters(d) && (tab === 'Tutti' || d['Tipo'] === tab));
  filtered.forEach(d => {
    const card = document.createElement('div');
    card.className = 'card ' + getColorClass(d['Tipo']);
    card.innerHTML = `
      <h3>${d['Descrizione']}</h3>
      <p>${d['Città']}, ${d['Regione']}</p>
      <p>Budget: €${d['Budget (€)']} / ${d['Costo (crediti)']} crediti</p>
      <button onclick="addToCart(${d['Costo (crediti)']})">Acquisisci (+${d['Costo (crediti)']} crediti)</button>
    `;
    container.appendChild(card);
  });
}

function getColorClass(type) {
  switch(type) {
    case 'Lead': return 'blue';
    case 'Appuntamento': return 'fuchsia';
    case 'Contratto': return 'yellow';
    default: return 'green';
  }
}

function applyFilters(d) {
  // implement dropdown filters
  return true;
}

// Cart logic
function addToCart(credits) {
  cart.push(credits);
  userCredits += credits;
  updateCartUI();
}

function updateCartUI() {
  const list = document.getElementById('cart-items');
  list.innerHTML = '';
  cart.forEach((c, i) => list.innerHTML += `<li>+${c} crediti <button onclick="removeFromCart(${i})">×</button></li>`);
  document.getElementById('cart-total').innerText = `Totale crediti: ${userCredits}`;
}

function removeFromCart(index) {
  userCredits -= cart[index];
  cart.splice(index, 1);
  updateCartUI();
}

// PayPal integration
paypal.Buttons({
  createOrder: (data, actions) => actions.order.create({
    purchase_units: [{ amount: { value: (userCredits * EUR_PER_CREDIT).toString() } }]
  }),
  onApprove: (data, actions) => actions.order.capture().then(details => {
    alert('Pagamento completato da ' + details.payer.name.given_name);
    // Aquí puedes registrar la transacción en Firebase Firestore si lo deseas
  })
}).render('#paypal-button-container');

// Checkout button (for Revolut/bonifico info)
document.getElementById('checkout').addEventListener('click', () => {
  alert(`Per pagare ${userCredits} crediti (totale €${userCredits * EUR_PER_CREDIT}), effettua bonifico:
IBAN: LT67 3250 0328 0923 7250 (Revolut Bank UAB, Vilnius)
BIC/SWIFT: REVOLT21
Oppure PayPal usa il pulsante.`);
});
