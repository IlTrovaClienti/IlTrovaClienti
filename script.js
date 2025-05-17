const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?gid=71180301&output=tsv";
const REVOLUT_LINK = "https://checkout.revolut.com/pay/716c6260-3151-4a9b-ba52-670eb35db1b4";
let credits = 0;
const EUR_PER_CREDIT = 40;
let rows=[], cart=[], hidden=new Set();

/* DOM refs */
const creditsEl  = document.getElementById('crediti');
const euroEl     = document.getElementById('euroCrediti');
const cartListEl = document.getElementById('cartList');
const cartTotalEl= document.getElementById('cartTotal');
const mask       = document.getElementById('mask');
const modal      = document.getElementById('modalPay');
const ibanBox    = document.getElementById('ibanBox');

/* mapping tollerante */
const COL={Regione:['Regione'],Citta:['Città','Citta'],Categoria:['Categoria'],Tipo:['Tipo','Stato'],Costo:['Costo (crediti)','Costo crediti','Crediti'],Tel:['Telefono']};
const V=(r,keys)=>{for(const k of keys) if(r[k]!=undefined) return r[k].trim(); return ''; };

/* modal handlers */
btnRicarica.onclick=()=>openModal();
closeModal.onclick=closeModal;
mask.onclick=closeModal;
payRevolut.onclick=()=>{addCredits(10);closeModal();window.open(REVOLUT_LINK,'_blank');};
showIban.onclick=()=>ibanBox.classList.toggle('hidden');

function openModal(){mask.classList.add('open');modal.classList.add('open');}
function closeModal(){mask.classList.remove('open');modal.classList.remove('open');}
function addCredits(n){credits+=n;updateCredits();}
function updateCredits(){creditsEl.textContent=credits;euroEl.textContent=(credits*EUR_PER_CREDIT).toFixed(0);}

/* TSV load */
fetch(SHEET_URL).then(r=>r.text()).then(txt=>{rows=parse(txt);initFilters();renderCards();}).catch(console.error);
function parse(tsv){const lines=tsv.trim().split('\n').map(r=>r.split('\t'));const head=lines.shift();return lines.map((r,i)=>{let o={__id:'row'+i};head.forEach((h,idx)=>o[h.trim()]=r[idx]||'');return o;});}

/* filtri */
const sel={Regione:regioneFilter,Citta:cittaFilter,Categoria:categoriaFilter,Tipo:tipoFilter};
Object.values(sel).forEach(s=>s.onchange=renderCards);
document.querySelectorAll('.tab').forEach(btn=>btn.onclick=e=>{document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));e.currentTarget.classList.add('active');sel.Tipo.value=e.currentTarget.dataset.type;renderCards();});

function initFilters(){for(const [logic,keys] of Object.entries(COL).filter(([k])=>k!=='Costo'&&k!=='Tel')){const vals=[...new Set(rows.map(r=>V(r,keys)).filter(Boolean))].sort();sel[logic].innerHTML='<option value="">Tutti</option>'+vals.map(v=>`<option>${v}</option>`).join('');}}

function norm(tipo){tipo=tipo.toLowerCase();return tipo.startsWith('lead')?'lead':tipo.startsWith('app')?'app':'contr';}

function renderCards(){const f={Regione:sel.Regione.value,Citta:sel.Citta.value,Categoria:sel.Categoria.value,Tipo:sel.Tipo.value};const list=rows.filter(r=>(!f.Regione||V(r,COL.Regione)===f.Regione)&&(!f.Citta||V(r,COL.Citta)===f.Citta)&&(!f.Categoria||V(r,COL.Categoria)===f.Categoria)&&(!f.Tipo||V(r,COL.Tipo)===f.Tipo)&&!hidden.has(r.__id));cards.innerHTML=list.map(cardHTML).join('');}

function cardHTML(r){const tipo=V(r,COL.Tipo);const cls=norm(tipo);const cost=Number(V(r,COL.Costo)||1);const phone=hidden.has(r.__id)?V(r,COL.Tel):'•••••••••';return `<div class="card ${cls}"><h4>${r.Descrizione||''}</h4><small>${V(r,COL.Regione)} / ${V(r,COL.Citta)} – ${V(r,COL.Categoria)}</small><span class="badge ${cls}">${tipo}</span><p><b>Telefono:</b> ${phone}</p><button class="btn btn-green" onclick="acq('${r.__id}',${cost})">Acquisisci (${cost} cr)</button></div>`;}

function acq(id,cost){if(credits<cost){openModal();return;}credits-=cost;updateCredits();hidden.add(id);cart.push({id,cost});renderCart();renderCards();}
function undo(i){const it=cart[i];credits+=it.cost;updateCredits();hidden.delete(it.id);cart.splice(i,1);renderCart();renderCards();}
function renderCart(){cartListEl.innerHTML=cart.map((c,i)=>`<li>#${i+1} – ${c.cost} cr <button class="btn btn-grey small" onclick="undo(${i})">Annulla</button></li>`).join('');cartTotalEl.textContent=cart.reduce((s,c)=>s+c.cost,0);}
