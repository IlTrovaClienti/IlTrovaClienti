// script.js
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let data = [], carrello = [];

// Column headers and matching select IDs
const cols = ['Regione','Città','Categoria','Tipo'];
const ids  = ['regione','citta','categoria','tipo'];

// Mapping category keywords to color
const mapColor = {
  lead: '#0085FF',
  appuntamento: '#FF00FF',
  contratto: '#FFD700'
};

window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(res => res.text())
    .then(parseTSV)
    .then(parsed => {
      data = parsed;
      initFilters();
      showCards(data);
    })
    .catch(console.error);
});

function parseTSV(tsv) {
  const lines = tsv.trim().split('\n');
  const headers = lines.shift().split('\t');
  return lines.map(line => {
    const vals = line.split('\t');
    return Object.fromEntries(headers.map((h,i)=>[h.trim(), vals[i]?.trim()||'']));
  });
}

function initFilters() {
  cols.forEach((col, i) => {
    const sel = document.getElementById(ids[i]);
    // clear old options
    sel.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove());
    // fill new
    [...new Set(data.map(r=>r[col]))]
      .sort()
      .forEach(v => {
        const o = document.createElement('option');
        o.value = o.textContent = v;
        sel.appendChild(o);
      });
    sel.addEventListener('change', () => {
      const filtered = applyFilters();
      showCards(filtered);
    });
  });
}

function applyFilters() {
  const crit = {};
  ids.forEach((id,i)=> crit[cols[i]] = document.getElementById(id).value );
  return data.filter(r =>
    cols.every(c => crit[c] === 'Tutti' || r[c] === crit[c])
  );
}

function showCards(list) {
  const main = document.getElementById('clienti');
  main.innerHTML = '';
  list.forEach(r => {
    // detect simple category key
    const catKey = r.Categoria.toLowerCase().includes('lead') ? 'lead'
                  : r.Categoria.toLowerCase().includes('appuntamento') ? 'appuntamento'
                  : 'contratto';
    const borderColor = mapColor[catKey];

    const card = document.createElement('div');
    card.className = 'cliente-card';
    card.style.borderLeft = `4px solid ${borderColor}`;

    card.innerHTML = `
      <span class="badge ${catKey}">${r.Categoria}</span>
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
    main.appendChild(card);
  });
}

function addToCart(id, cred) {
  if (!carrello.find(x=>x.id===id)) {
    carrello.push({id, cred});
    updateCart();
  }
}

function removeFromCart(id) {
  carrello = carrello.filter(x=>x.id!==id);
  updateCart();
}

function updateCart() {
  document.getElementById('carrello').innerHTML =
    carrello.map(x=>`<li>${x.id} – ${x.cred} crediti</li>`).join('');
  document.getElementById('totale').textContent =
    `Totale: €${carrello.reduce((s,x)=>s+x.cred,0)}`;
}
