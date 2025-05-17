
/* IlTrovaClienti v1.0.5 */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv&gid=71180301";
let userCrediti = 5;
const EURO_PER_CREDITO = 40;

let data = [];
let carrello = [];
let nascosti = new Set();

const COLS = ['Regione', 'Città', 'Categoria', 'Tipo'];
const IDS  = ['regione', 'citta', 'categoria', 'tipo'];

const cardsEl = document.getElementById('cards');
const creditiEl = document.getElementById('crediti');
const euroCreditiEl = document.getElementById('euroCrediti');
const totaleCarrelloEl = document.getElementById('totaleCarrello');
const carrelloListEl = document.getElementById('carrelloList');

creditiEl.textContent = userCrediti;
euroCreditiEl.textContent = (userCrediti * EURO_PER_CREDITO).toFixed(2);

// fetch
async function fetchData() {{
  const res = await fetch(SHEET_URL);
  if(!res.ok) throw new Error('Fetch ' + res.status);
  const tsv = await res.text();
  const rows = tsv.trim().split('\n').map(r=>r.split('\t'));
  const headers = rows.shift();
  data = rows.map((r,i)=>{{
    let obj={{}};
    headers.forEach((h,idx)=>obj[h.trim()]=r[idx]||'');
    obj.__id='row'+i;
    return obj;
  }});
  renderFilters();
  renderCards();
}}
fetchData().catch(console.error);

// filters
function renderFilters() {{
  COLS.forEach((col,i)=>{{
    const sel=document.getElementById(IDS[i]);
    const vals=[...new Set(data.map(d=>d[col]).filter(Boolean))].sort();
    sel.innerHTML='<option value="">Tutti</option>' + vals.map(v=>`<option value="${{v}}">${{v}}</option>`).join('');
    sel.onchange=renderCards;
  }});
}}

function renderCards() {{
  const f={{regione:regione.value,citta:citta.value,categoria:categoria.value,tipo:tipo.value}};
  const vis=data.filter(d=>
    (!f.regione||d.Regione===f.regione)&&
    (!f.citta||d.Città===f.citta)&&
    (!f.categoria||d.Categoria===f.categoria)&&
    (!f.tipo||d.Tipo===f.tipo)&&
    !nascosti.has(d.__id)
  );
  cardsEl.innerHTML=vis.map(cardHTML).join('');
}}

function cardHTML(d){{
  const cls=d.Tipo==='Lead'?'lead':(d.Tipo==='Appuntamento'?'app':'contratto');
  const prezzo=Number(d.Prezzo||0).toFixed(0);
  return `<div class="card ${{cls}}">
    <strong>${{d.Descrizione||''}}</strong><br>
    <small>${{d.Regione}} / ${{d.Città}} – ${{d.Categoria}}</small><br>
    <b>Prezzo: €${{prezzo}}</b><br>
    <button onclick="addToCart('${{d.__id}}',${{prezzo}})">Acquisisci</button>
  </div>`;
}}

function addToCart(id, prezzo){{
  if(userCrediti<=0){{alert('Crediti esauriti');return;}}
  nascosti.add(id);
  carrello.push({{id,prezzo:Number(prezzo)}});
  userCrediti--; updateUI();
}}

function removeFromCart(i){{
  const item=carrello[i];
  nascosti.delete(item.id);
  carrello.splice(i,1);
  userCrediti++; updateUI();
}}

function updateUI(){{
  creditiEl.textContent=userCrediti;
  euroCreditiEl.textContent=(userCrediti*EURO_PER_CREDITO).toFixed(2);
  totaleCarrelloEl.textContent=carrello.reduce((s,c)=>s+c.prezzo,0).toFixed(2);
  carrelloListEl.innerHTML=carrello.map((c,i)=>`<li>#${{i+1}} €${{c.prezzo}} <button onclick="removeFromCart(${{i}})">Annulla</button></li>`).join('');
  renderCards();
}}
