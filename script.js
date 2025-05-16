const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

let data = [], carrello = [];

const cols = ['Regione','Città','Categoria','Tipo'];
const ids  = ['regione','citta','categoria','tipo'];

window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(r => r.text())
    .then(parseTSV)
    .then(parsed => {
      data = parsed;
      popolaFiltri();
      renderCards(data);
    })
    .catch(console.error);
});

function parseTSV(tsv) {
  const lines = tsv.trim().split('\n');
  const headers = lines.shift().split('\t');
  return lines.map(l => {
    const vals = l.split('\t');
    return Object.fromEntries(headers.map((h,i) => [h.trim(), vals[i]?.trim()||'']));
  });
}

function popolaFiltri() {
  cols.forEach((col, idx) => {
    const sel = document.getElementById(ids[idx]);
    sel.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());
    [...new Set(data.map(r => r[col]))]
      .sort()
      .forEach(v => {
        const o = document.createElement('option');
        o.value = o.textContent = v;
        sel.appendChild(o);
      });
    sel.addEventListener('change', applicaFiltri);
  });
}

function applicaFiltri() {
  const crit = {};
  ids.forEach((id, i) => crit[cols[i]] = document.getElementById(id).value);
  const filtered = data.filter(r => {
    return cols.every(c => crit[c]==='Tutti' || r[c]===crit[c]);
  });
  renderCards(filtered);
}

function renderCards(list) {
  const main = document.getElementById('clienti');
  main.innerHTML = '';
  list.forEach(r => {
    const div = document.createElement('div');
    div.className = 'cliente-card ' + r.Categoria.toLowerCase();
    div.innerHTML = `
      <span class="badge ${r.Categoria.toLowerCase()}">${r.Categoria}</span>
      <h3>${r.Tipo}</h3>
      <p class="desc">${r.Descrizione}</p>
      <p><strong>${r.Città}, ${r.Regione}</strong></p>
      <p class="commission">
        Tel: ${r.Telefono} – Budget: €${r["Budget (€)"]} – 
        Costo: ${r["Costo (crediti)"]} crediti
      </p>
      <div class="actions">
        <button class="acquisisci" onclick="aggiungiCarrello('${r.Telefono}', ${r["Costo (crediti)"]})">Acquisisci</button>
        <button class="annulla" onclick="rimuoviDalCarrello('${r.Telefono}')">Annulla</button>
      </div>`;
    main.appendChild(div);
  });
}

function aggiungiCarrello(id, cred) {
  if (!carrello.find(x => x.id === id)) {
    carrello.push({id, cred});
    aggiornaCarrello();
  }
}

function rimuoviDalCarrello(id) {
  carrello = carrello.filter(x => x.id !== id);
  aggiornaCarrello();
}

function aggiornaCarrello() {
  const c = document.getElementById('carrello');
  c.innerHTML = carrello.map(x => `<li>${x.id} – ${x.cred} crediti</li>`).join('');
  document.getElementById('totale').textContent = `Totale: €${carrello.reduce((s,x) => s+x.cred,0)}`;
}