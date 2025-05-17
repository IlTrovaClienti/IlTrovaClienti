const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?gid=71180301&output=tsv";
let credits = 0;
const EUR_PER_CREDIT = 40;
let rows=[], cart=[], hidden=new Set();

// DOM refs
const creditsEl = document.getElementById('crediti');
const euroEl = document.getElementById('euroCrediti');
const cartListEl = document.getElementById('cartList');
const cartTotalEl = document.getElementById('cartTotal');
const modal = document.getElementById('modalPay');
const mask = document.getElementById('mask');
const ibanBox = document.getElementById('ibanBox');

// mapping tollerante
const COL={Regione:['Regione'],Citta:['Città','Citta'],Categoria:['Categoria'],Tipo:['Tipo','Stato']};
const val=(r,keys)=>{for(const k of keys) if(r[k]!=undefined) return r[k].trim(); return '';}

// modal handlers
btnRicarica.onclick = ()=>openModal();
closeModal.onclick = closeModalHandler;
mask.onclick = closeModalHandler;
payRevolut.onclick = ()=>{addCredits(10);closeModalHandler();window.open('https://checkout.revolut.com/pay/716c6260-3151-4a9b-ba52-670eb35db1b4','_blank');};
showIban.onclick = ()=>{ibanBox.classList.toggle('hidden');};

function openModal(){mask.classList.add('open');modal.classList.add('open');}
function closeModalHandler(){mask.classList.remove('open');modal.classList.remove('open');}
function addCredits(n){credits+=n;updateCredits();}

function updateCredits(){creditsEl.textContent=credits;euroEl.textContent=(credits*EUR_PER_CREDIT).toFixed(0);}

// fetch TSV
fetch(SHEET_URL).then(r=>r.text()).then(t=>{rows=parse(t);initFilters();renderCards();}).catch(console.error);

function parse(tsv){const l=tsv.trim().split('\n').map(r=>r.split('\t'));const h=l.shift();return l.map((r,i)=>{let o={__id:'r'+i};h.forEach((k,j)=>o[k.trim()]=r[j]||'');return o;});}

const sel={Regione:regioneFilter,Citta:cittaFilter,Categoria:categoriaFilter,Tipo:tipoFilter};
Object.values(sel).forEach(s=>s.onchange=renderCards);
document.querySelectorAll('.tab').forEach(btn=>btn.onclick=e=>{document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));e.currentTarget.classList.add('active');sel.Tipo.value=e.currentTarget.dataset.type;renderCards();});

function initFilters(){for(const [logic,keys] of Object.entries(COL)){const opts=[...new Set(rows.map(r=>val(r,keys)).filter(Boolean))].sort();sel[logic].innerHTML='<option value="">Tutti</option>'+opts.map(v=>`<option>${v}</option>`).join('');}}

function norm(tipo){return tipo.toLowerCase().startsWith('lead')?'lead':tipo.toLowerCase().startsWith('app')?'app':'contr';}

function renderCards(){const f={Regione:sel.Regione.value,Citta:sel.Citta.value,Categoria:sel.Categoria.value,Tipo:sel.Tipo.value};const list=rows.filter(r=>(!f.Regione||val(r,COL.Regione)===f.Regione)&&(!f.Citta||val(r,COL.Citta)===f.Citta)&&(!f.Categoria||val(r,COL.Categoria)===f.Categoria)&&(!f.Tipo||val(r,COL.Tipo)===f.Tipo)&&!hidden.has(r.__id));cards.innerHTML=list.map(cardHTML).join('');}

function cardHTML(r){const tipo=val(r,COL.Tipo);const cls=norm(tipo);const costo=Number(r['Costo (crediti)']||1);const phone=hidden.has(r.__id)?r.Telefono:'•••••••••';return `<div class="card ${cls}"><h4>${r.Descrizione||''}</h4><small>${val(r,COL.Regione)} / ${val(r,COL.Citta)} – ${val(r,COL.Categoria)}</small><span class="badge ${cls}">${tipo}</span><p><b>Telefono:</b> ${phone}</p><button class="btn btn-green" onclick="acq('${r.__id}',${costo})">Acquisisci (${costo} cr)</button></div>`;}

function acq(id,costo){if(credits<costo){openModal();return;}credits-=costo;updateCredits();hidden.add(id);cart.push({id,costo});renderCart();renderCards();}

function undo(idx){const it=cart[idx];credits+=it.costo;updateCredits();hidden.delete(it.id);cart.splice(idx,1);renderCart();renderCards();}

function renderCart(){cartListEl.innerHTML=cart.map((c,i)=>`<li>#${i+1} – ${c.costo} cr <button class="btn btn-grey small" onclick="undo(${i})">Annulla</button></li>`).join('');cartTotalEl.textContent=cart.reduce((s,c)=>s+c.costo,0);}
