
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
  document.getElementById('regioneFilter').addEventListener('change', applicaFiltri);
  document.getElementById('cittaFilter').addEventListener('change', applicaFiltri);
  document.getElementById('categoriaFilter').addEventListener('change', applicaFiltri);
  document.getElementById('tipoFilter').addEventListener('change', applicaFiltri);
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
  document.getElementById('regioneFilter').value = '';
  document.getElementById('cittaFilter').value = '';
  document.getElementById('categoriaFilter').value = '';
  document.getElementById('tipoFilter').value = '';
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
  switch (categoria.toLowerCase()) {
    case 'lead': return 'card card-lead';
    case 'appuntamenti': return 'card card-appuntamenti';
    case 'contratti': return 'card card-contratti';
    default: return 'card';
  }
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
      <button class="btn-${d.Categoria.toLowerCase()}" onclick="aggiungiAlCarrello(${d.Costo}, this)">Aggiungi</button>
      <button onclick="annullaDalCarrello(${d.Costo}, this)">Annulla</button>
    `;
    container.appendChild(div);
  });
}

function aggiungiAlCarrello(costo, btn) {
  if (creditiUtente >= costo) {
    creditiUtente -= costo;
    carrello.push(costo);
    aggiornaCrediti();
    aggiornaCarrello();
  } else {
    alert("Crediti insufficienti.");
  }
}

function annullaDalCarrello(costo, btn) {
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

// AUTH

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById('user-email').textContent = user.user.email;
      document.getElementById('login-register').style.display = 'none';
    })
    .catch(err => {
      document.getElementById('auth-msg').textContent = err.message;
    });
}

function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById('user-email').textContent = user.user.email;
      document.getElementById('login-register').style.display = 'none';
    })
    .catch(err => {
      document.getElementById('auth-msg').textContent = err.message;
    });
}

function logout() {
  firebase.auth().signOut().then(() => {
    location.reload();
  });
}
