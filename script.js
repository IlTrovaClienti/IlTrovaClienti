const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

let data = [];
let creditiUtente = 0;
let carrello = [];

window.onload = async () => {
  setupEventListeners();
  await caricaDati();
  popolaFiltri();
  applicaFiltri();
};

function setupEventListeners() {
  document.getElementById('resetFilters').addEventListener('click', resetFiltri);
  ['regioneFilter', 'cittaFilter', 'categoriaFilter', 'tipoFilter'].forEach(id => {
    document.getElementById(id).addEventListener('change', applicaFiltri);
  });
  document.getElementById('ricarica-btn').addEventListener('click', () => {
    creditiUtente += 10;
    aggiornaCrediti();
  });
  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('register-btn').addEventListener('click', register);
  document.getElementById('logout-btn').addEventListener('click', logout);
}

function aggiornaCrediti() {
  document.getElementById('crediti-utente').textContent = creditiUtente;
}

function resetFiltri() {
  ['regioneFilter', 'cittaFilter', 'categoriaFilter', 'tipoFilter'].forEach(id => {
    document.getElementById(id).value = '';
  });
  applicaFiltri();
}

async function caricaDati() {
  const res = await fetch(SHEET_URL);
  const tsv = await res.text();
  const rows = tsv.trim().split('\n').slice(1);
  data = rows.map(row => {
    const [Regione, Città, Categoria, Tipo, Descrizione, Telefono, Budget, Costo] = row.split('\t');
    return { Regione, Città, Categoria, Tipo, Descrizione, Telefono, Budget, Costo: parseInt(Costo) };
  });
}

function popolaFiltri() {
  const filtri = {
    regioneFilter: [...new Set(data.map(d => d.Regione))],
    cittaFilter: [...new Set(data.map(d => d.Città))],
    categoriaFilter: [...new Set(data.map(d => d.Categoria))],
    tipoFilter: [...new Set(data.map(d => d.Tipo))]
  };

  for (const [id, valori] of Object.entries(filtri)) {
    const select = document.getElementById(id);
    valori.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }
}

function getCardClass(categoria) {
  const c = categoria.toLowerCase();
  if (c.includes("lead")) return "card card-lead";
  if (c.includes("appuntamento")) return "card card-appuntamenti";
  if (c.includes("contratto")) return "card card-contratti";
  return "card";
}

function applicaFiltri() {
  const r = document.getElementById('regioneFilter').value;
  const c = document.getElementById('cittaFilter').value;
  const cat = document.getElementById('categoriaFilter').value;
  const t = document.getElementById('tipoFilter').value;
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  const filtrati = data.filter(d =>
    (!r || d.Regione === r) &&
    (!c || d.Città === c) &&
    (!cat || d.Categoria === cat) &&
    (!t || d.Tipo === t)
  );

  filtrati.forEach(d => {
    const div = document.createElement('div');
    div.className = getCardClass(d.Categoria);
    div.innerHTML = `
      <h4>${d.Categoria} - ${d.Tipo}</h4>
      <p>${d.Descrizione}</p>
      <p><strong>${d.Città}, ${d.Regione}</strong></p>
      <p>📞 ${d.Telefono}</p>
      <p>💶 ${d.Budget} — 🔑 ${d.Costo} crediti</p>
      <button class="btn-${d.Categoria.toLowerCase().includes('lead') ? 'lead' : d.Categoria.toLowerCase().includes('appuntamento') ? 'appuntamenti' : 'contratti'}" onclick="aggiungiAlCarrello(${d.Costo})">Aggiungi</button>
      <button onclick="annullaDalCarrello(${d.Costo})">Annulla</button>
    `;
    container.appendChild(div);
  });
}

function aggiungiAlCarrello(costo) {
  if (creditiUtente >= costo) {
    creditiUtente -= costo;
    carrello.push(costo);
    aggiornaCrediti();
    aggiornaCarrello();
  } else {
    alert("Crediti insufficienti.");
  }
}

function annullaDalCarrello(costo) {
  const index = carrello.indexOf(costo);
  if (index !== -1) {
    carrello.splice(index, 1);
    creditiUtente += costo;
    aggiornaCrediti();
    aggiornaCarrello();
  }
}

function aggiornaCarrello() {
  const lista = document.getElementById('carrello-lista');
  lista.innerHTML = '';
  carrello.forEach((costo, i) => {
    const li = document.createElement('li');
    li.textContent = `Elemento ${i + 1} - ${costo} crediti`;
    lista.appendChild(li);
  });
  document.getElementById('totale-crediti').textContent = carrello.reduce((a, b) => a + b, 0);
}

function login() {}
function register() {}
function logout() {}
