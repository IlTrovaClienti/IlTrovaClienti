// script.js

const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let data = [], carrello = [];

// colonne e select IDs
const cols = ['Regione','Città','Categoria','Tipo'];
const selIds = ['regione','citta','categoria','tipo'];

window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(r => r.text())
    .then(parseTSV)
    .then(parsed => {
      data = parsed;
      initFilters();
      renderCards(data);
    })
    .catch(console.error);
});

function parseTSV(tsv) {
  const lines = tsv.trim().split('\n');
  const headers = lines.shift().split('\t');
  return lines.map(line => {
    const vals = line.split('\t');
    return Object.fromEntries(headers.map((h,i) => [h.trim(), vals[i]?.trim()||'']));
  });
}

function initFilters() {
  cols.forEach((col, idx) => {
    const sel = document.getElementById(selIds[idx]);
    // pulisci opzioni
    sel.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());
    // aggiungi new
    [...new Set(data.map(r=>r[col]))].sort().forEach(val => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = val;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      const filtered = applyFilters();
      renderCards(filtered);
    });
  });
}

function applyFilters() {
  const crit = {};
  cols.forEach((col, i) => crit[col] = document.getElementById(selIds[i]).value);
  return data.filter(r =>
    cols.every(col => crit[col] === 'Tutti' || r[col] === crit[col])
  );
}

function renderCards(list) {
  const main = document.getElementById('clienti');
  main.innerHTML = '';
  list.forEach(r => {
    // creazione card
    const card = document.createElement('div');
    card.className = 'cliente-card';
    card.innerHTML = `
      <span class="badge ${r.Categoria.toLowerCase().includes('lead')?'lead':
                          r.Categoria.toLowerCase().includes('appuntamento')?'appuntamento':'contratto'}">
        ${r.Categoria}
      </span>
      <h3>${r.Tipo}</h3>
      <p class="desc">${r.Descrizione}</p>
      <p><strong>${r.Città}, ${r.Regione}</strong></p>
      <p class="commission">
        Tel: ${r.Telefono} – Budget: €${r["Budget (€)"]} – 
        Costo: ${r["Costo (crediti)"]} crediti
      </p>
      <div class="actions">
        <button class="acquisisci" onclick="addToCart('${r.Telefono}', ${r["Costo (crediti)"]})">
          Acquisisci
        </button>
        <button class="annulla" onclick="removeFromCart('${r.Telefono}')">
          Annulla
        </button>
      </div>`;

    // estrai badge e applica bordo
    const badge = card.querySelector('.badge');
    if (badge) {
      const bg = getComputedStyle(badge).backgroundColor;
      card.style.borderLeft = `4px solid ${bg}`;
    }

    main.appendChild(card);
  });
}

function addToCart(id, cred) {
  if (!carrello.find(x => x.id === id)) {
    carrello.push({id, cred});
    updateCart();
  }
}

function removeFromCart(id) {
  carrello = carrello.filter(x => x.id !== id);
  updateCart();
}

function updateCart() {
  document.getElementById('carrello').innerHTML =
    carrello.map(x => `<li>${x.id} – ${x.cred} crediti</li>`).join('');
  document.getElementById('totale').textContent =
    `Totale: €${carrello.reduce((s,x) => s + x.cred, 0)}`;
}

// placeholder per openRicarica (se usi PayPal)
function openRicarica() {
  alert('Apri modale di ricarica...'); 
}
