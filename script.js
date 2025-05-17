
// === Config ===
let userCrediti = 5;               // crediti iniziali demo
const EURO_PER_CREDITO = 40;       // 1 credito = 40 €
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/gviz/tq?tqx=out:tsv&gid=0';

// === Stato ===
let data = [];
let carrello = [];

// === Riferimenti colonne / select ===
const COLS = ['Regione', 'Città', 'Categoria', 'Tipo'];
const IDS  = ['regione', 'citta', 'categoria', 'tipo'];

// === Init ===
window.addEventListener('DOMContentLoaded', () => {
  fetch(SHEET_URL)
    .then(r => r.text())
    .then(parseTSV)
    .then(parsed => {
      data = parsed;
      setupFilters();
      drawCards(data);
      updateCreditDisplay();
      try {
        if (window.paypal) paypal.Buttons().render('#paypal-button-container');
      } catch (_) {}
    })
    .catch(console.error);
});

// === Helpers ===
function parseTSV(tsv) {
  const lines   = tsv.trim().split('\n');
  const headers = lines.shift().split('\t');
  return lines.map(l => {
    const v = l.split('\t');
    return Object.fromEntries(headers.map((h, i) => [h.trim(), v[i]?.trim() || '']));
  });
}

function setupFilters() {
  COLS.forEach((col, i) => {
    const sel = document.getElementById(IDS[i]);
    // reset options (keep "Tutti")
    [...sel.querySelectorAll('option:not(:first-child)')].forEach(o => o.remove());
    // unique sorted values
    [...new Set(data.map(r => r[col]))]
      .sort()
      .forEach(v => {
        const o = document.createElement('option');
        o.value = o.textContent = v;
        sel.appendChild(o);
      });
    sel.addEventListener('change', () => drawCards(applyFilters()));
  });
}

function applyFilters() {
  const crit = {};
  COLS.forEach((col, i) => (crit[col] = document.getElementById(IDS[i]).value));
  return data.filter(r => COLS.every(col => crit[col] === 'Tutti' || r[col] === crit[col]));
}

// === Rendering ===
function drawCards(list) {
  const main = document.getElementById('clienti');
  main.innerHTML = '';
  list.forEach(r => {
    const tipoTxt = r.Tipo.toLowerCase();
    const cls =
      tipoTxt.includes('lead') ? 'lead' :
      tipoTxt.includes('appuntamento') ? 'appuntamento' : 'contratto';

    // costo crediti numerico
    const costoCred = parseInt(r['Costo (crediti)'] || '0', 10);

    const card = document.createElement('div');
    card.className = `cliente-card ${cls}`;
    card.dataset.phone   = r.Telefono;
    card.dataset.credits = costoCred;

    card.innerHTML = `
      <span class="badge ${cls}">${r.Categoria}</span>
      <h3>${r.Tipo}</h3>
      <p class="desc">${r.Descrizione}</p>
      <p><strong>${r.Città}, ${r.Regione}</strong></p>
      <p class="commission">Budget: €${r['Budget (€)']} – Costo: ${costoCred} crediti</p>
      <div class="actions">
        <button class="acquisisci">Acquisisci</button>
      </div>
    `;

    card.querySelector('.acquisisci').addEventListener('click', () => addToCart(card));
    main.appendChild(card);
  });
}

// === Carrello & Crediti ===
function addToCart(card) {
  const id        = card.dataset.phone;
  const credNec   = parseInt(card.dataset.credits, 10);

  if (carrello.find(x => x.id === id)) return; // già in carrello

  // trattativa riservata (0 crediti) sempre permessa
  if (credNec > 0 && userCrediti < credNec) {
    alert('Crediti insufficienti. Ricarica prima di acquisire.');
    return;
  }

  // scala crediti e salva
  userCrediti -= credNec;
  carrello.push({ id, crediti: credNec });
  updateCreditDisplay();
  updateCart();
  // rimuovi card dall'elenco
  card.remove();
}

function removeFromCart(id) {
  const idx = carrello.findIndex(x => x.id === id);
  if (idx === -1) return;
  // rimborsa
  userCrediti += carrello[idx].crediti;
  carrello.splice(idx, 1);
  updateCreditDisplay();
  updateCart();
  // ricompare card (più semplice: ricarichiamo filtrato)
  drawCards(applyFilters());
}

function updateCart() {
  const ul = document.getElementById('carrello');
  ul.innerHTML = carrello
    .map(x => `<li>${x.id} – ${x.crediti} crediti <button onclick="removeFromCart('${x.id}')">Annulla</button></li>`)
    .join('');
  const totCred = carrello.reduce((s, x) => s + x.crediti, 0);
  document.getElementById('totale').textContent = `Totale: €${totCred * EURO_PER_CREDITO}`;
}

function updateCreditDisplay() {
  document.getElementById('crediti').textContent = userCrediti;
  document.getElementById('euro').textContent    = `€${(userCrediti * EURO_PER_CREDITO).toFixed(2)}`;
}

// === Buttons rapido ===
function resetFilters() {
  IDS.forEach(id => (document.getElementById(id).value = 'Tutti'));
  drawCards(data);
}
function filterByCategoria(catTxt) {
  drawCards(data.filter(r => r.Categoria.includes(catTxt)));
}

// === Link ricarica (placeholder) ===
function openRicarica() {
  // Modal semplificato con Revolut / PayPal / IBAN
  alert('Apri link di pagamento per ricaricare i crediti.');
}
