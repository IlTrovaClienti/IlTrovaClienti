// script.js
// Tutto dentro DOMContentLoaded grazie a defer negli <script>
(() => {
  // === Config ===
  let userCredits = 0;
  const EUR_PER_CREDIT = 40;
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

  // === Stato ===
  let rows = [];
  let cart = [];
  const hiddenIds = new Set();

  // === DOM Elements ===
  const ricaricaBtn = document.getElementById('ricaricaBtn');
  const loginBtn    = document.getElementById('loginBtn');
  const logoutBtn   = document.getElementById('logoutBtn');
  const creditiEl   = document.getElementById('crediti');
  const cardsEl     = document.getElementById('cards');
  const cartListEl  = document.getElementById('cartList');
  const cartTotalEl = document.getElementById('cartTotal');

  const selReg     = document.getElementById('regioneFilter');
  const selCitt    = document.getElementById('cittaFilter');
  const selCat     = document.getElementById('categoriaFilter');
  const selTipo    = document.getElementById('tipoFilter');

  // Controlla che esistano davvero
  if (!ricaricaBtn || !loginBtn || !logoutBtn || !credetiEl || !cardsEl) {
    console.error('+++ ERRORE: elementi DOM mancanti +++');
    return;
  }

  // === Eventi Topbar ===
  ricaricaBtn.addEventListener('click', () => {
    userCredits = 0;
    updateCredits();
    loadTSV();
  });
  loginBtn.addEventListener('click', () => {
    document.getElementById('loginModal').classList.add('open');
    document.getElementById('modalMask').classList.add('open');
  });
  logoutBtn.addEventListener('click', () => {
    auth.signOut();
  });

  // === Eventi Filtri ===
  [selReg, selCitt, selCat, selTipo].forEach(s => {
    s.addEventListener('change', renderCards);
  });

  // === Eventi Tabs ===
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter === 'all' ? '' : tab.dataset.filter;
      selTipo.value = filter;  // usiamo 'Tipo' per distinguere, il resto è gestito in render
      renderCards();
    });
  });

  // === Inizializzazione ===
  updateCredits();
  loadTSV();

  // ---------------- Funzioni ----------------
  function updateCredits() {
    creditiEl.textContent = `Crediti: ${userCredits} (€${(userCredits * EUR_PER_CREDIT).toFixed(2)})`;
  }

  function loadTSV() {
    fetch(SHEET_URL)
      .then(r => r.text())
      .then(tsv => {
        rows = parseTSV(tsv);
        initFilters();
        renderCards();
      })
      .catch(err => console.error('Errore caricamento TSV:', err));
  }

  function parseTSV(tsv) {
    const lines = tsv.trim().split('\n').map(l => l.split('\t'));
    const header = lines.shift();
    return lines.map((r, i) => {
      const obj = {};
      header.forEach((h, idx) => obj[h.trim()] = r[idx] || '');
      obj.__id = 'row' + i;
      return obj;
    });
  }

  function initFilters() {
    const map = { regione: 'Regione', citta: 'Città', categoria: 'Categoria', tipo: 'Tipo' };
    Object.entries(map).forEach(([id, col]) => {
      const sel = document.getElementById(id + 'Filter');
      const values = [...new Set(rows.map(d => d[col]).filter(Boolean))].sort();
      sel.innerHTML = `<option value="">${col}</option>` +
        values.map(v => `<option value="${v}">${v}</option>`).join('');
    });
  }

  function renderCards() {
    const fReg = selReg.value, fCit = selCitt.value;
    const fCat = selCat.value, fTip = selTipo.value;
    const visible = rows.filter(d =>
      (!fReg || d.Regione === fReg) &&
      (!fCit || d['Città'] === fCit) &&
      (!fCat || d.Categoria === fCat) &&
      (!fTip || d.Tipo === fTip) &&
      !hiddenIds.has(d.__id)
    );
    cardsEl.innerHTML = visible.map(cardHTML).join('');
  }

  function cardHTML(d) {
    const cls = d.Tipo === 'Lead' ? 'lead' : (d.Tipo === 'Appuntamento' ? 'app' : 'contr');
    const price = Number(d['Costo (crediti)'] || 0);
    const btnText = d.Tipo === 'Contratto'
      ? 'Riserva'
      : `Acquisisci (+${price} credito${price>1?'i':''})`;
    return `
      <div class="card ${cls}">
        <h4>${d.Descrizione}</h4>
        <small>${d.Regione} / ${d['Città']} – ${d.Categoria}</small>
        <span class="badge ${cls}">${d.Tipo}</span>
        <p>Telefono: ${d.Tipo === 'Contratto' ? '•••••••••' : d.Telefono}</p>
        <button class="btn btn-green" onclick="addToCart('${d.__id}',${price})">
          ${btnText}
        </button>
      </div>`;
  }

  window.addToCart = (id, price) => {
    hiddenIds.add(id);
    cart.push({ id, price });
    renderCart();
    renderCards();
  };

  function renderCart() {
    cartListEl.innerHTML = cart.map((c, i) =>
      `<li>#${i+1} €${c.price} <button onclick="undoCart(${i})">Annulla</button></li>`
    ).join('');
    cartTotalEl.textContent = cart.reduce((s, c) => s + c.price, 0).toFixed(2);
  }

  window.undoCart = idx => {
    const item = cart[idx];
    cart.splice(idx, 1);
    hiddenIds.delete(item.id);
    renderCart();
    renderCards();
  };

})();  
