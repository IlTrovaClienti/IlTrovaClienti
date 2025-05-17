
// === Config ===
let userCrediti = 5;               // crediti iniziali demo
const EURO_PER_CREDITO = 40;       // 1 credito = 40 €
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv&gid=71180301';

// === Stato ===
let data = [];
let carrello = [];

// === Riferimenti colonne / select ===
const COLS = ['Regione', 'Città', 'Categoria', 'Tipo'];
const IDS  = ['regione', 'citta', 'categoria', 'tipo'];

// === Elementi DOM ===
const cardsEl = document.getElementById('cards');
const creditiEl = document.getElementById('crediti');
const euroCreditiEl = document.getElementById('euroCrediti');
const totaleCarrelloEl = document.getElementById('totaleCarrello');

// === Fetch TSV ===
async function fetchData() {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error('Fetch sheet failed ' + res.status);
    const tsv = await res.text();
    const rows = tsv.trim().split('\n').map(r => r.split('\t'));
    const headers = rows.shift();
    data = rows.map(r => Object.fromEntries(headers.map((h,i)=>[h.trim(), r[i] ?? ''])));
    renderFilters();
    renderCards();
}
fetchData().catch(err => { console.error(err); });

// === Rendering ===
function renderFilters() {
    COLS.forEach((col, idx) => {
        const sel = document.getElementById(IDS[idx]);
        const vals = [...new Set(data.map(d => d[col]).filter(Boolean))].sort();
        sel.innerHTML = '<option value="">Tutti</option>' + vals.map(v=>`<option value="${v}">${v}</option>`).join('');
        sel.onchange = renderCards;
    });
}
function renderCards() {
    const filt = {
        regione: document.getElementById('regione').value,
        citta: document.getElementById('citta').value,
        categoria: document.getElementById('categoria').value,
        tipo: document.getElementById('tipo').value,
    };
    const vis = data.filter(d => (!filt.regione||d.Regione===filt.regione) &&
                                  (!filt.citta||d.Città===filt.citta) &&
                                  (!filt.categoria||d.Categoria===filt.categoria) &&
                                  (!filt.tipo||d.Tipo===filt.tipo));
    cardsEl.innerHTML = vis.map(d=>cardHTML(d)).join('');
}
function cardHTML(d) {
    const cls = d.Tipo==='Lead'?'lead':(d.Tipo==='Appuntamento'?'app':'contratto');
    return `<div class="card ${cls}">
        <strong>${d.Descrizione??''}</strong><br>
        Regione: ${d.Regione} | Città: ${d.Città}<br>
        Categoria: ${d.Categoria}<br>
        Prezzo: €${d.Prezzo??''}<br>
        <button onclick="addToCart('${d.id??Math.random()}', ${d.Prezzo??0})">Acquisisci</button>
    </div>`;
}
function addToCart(id, prezzo) {
    carrello.push({id, prezzo:Number(prezzo)||0});
    updateCart();
}
function updateCart() {
    totaleCarrelloEl.textContent = carrello.reduce((s,c)=>s+c.prezzo,0).toFixed(2);
}
