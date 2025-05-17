
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?gid=71180301&output=tsv";
let rows=[], cart=[], hidden=new Set();

const sel={reg:regioneFilter,cit:cittaFilter,cat:categoriaFilter,tipo:tipoFilter};
Object.values(sel).forEach(s=>s.onchange=renderCards);

document.querySelectorAll('.tab').forEach(btn=>btn.onclick=e=>{document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));e.currentTarget.classList.add('active');sel.tipo.value=e.currentTarget.dataset.type;renderCards();});

function parse(tsv){const l=tsv.trim().split('\n').map(r=>r.split('\t'));const h=l.shift();return l.map((r,i)=>{let o={__id:'r'+i};h.forEach((k,j)=>o[k.trim()]=r[j]||'');return o;});}

fetch(SHEET_URL).then(r=>r.text()).then(t=>{rows=parse(t);initFilters();renderCards();}).catch(console.error);

function initFilters(){const m={reg:'Regione',cit:'Città',cat:'Categoria',tipo:'Tipo'};for(const k in m){const v=[...new Set(rows.map(r=>r[m[k]]).filter(Boolean))].sort();sel[k].innerHTML='<option value="">Tutti</option>'+v.map(x=>`<option>${x}</option>`).join('');}}

function renderCards(){const f={Regione:sel.reg.value,'Città':sel.cit.value,Categoria:sel.cat.value,Tipo:sel.tipo.value};const v=rows.filter(r=>(!f.Regione||r.Regione===f.Regione)&&(!f['Città']||r['Città']===f['Città'])&&(!f.Categoria||r.Categoria===f.Categoria)&&(!f.Tipo||r.Tipo===f.Tipo)&&!hidden.has(r.__id));cards.innerHTML=v.map(cardHTML).join('');}

function cardHTML(r){const cls=r.Tipo==='Lead'?'lead':(r.Tipo==='Appuntamento'?'app':'contr');return `<div class="card ${cls}"><strong>${r.Descrizione||''}</strong><br><small>${r.Regione} / ${r['Città']} – ${r.Categoria}</small><br><b>Prezzo: €${r.Prezzo||0}</b><br><button onclick="acq('${r.__id}',${r.Prezzo||0})">Acquisisci</button></div>`;}

function acq(id,p){hidden.add(id);cart.push({id,p});renderCart();renderCards();}
function undo(i){hidden.delete(cart[i].id);cart.splice(i,1);renderCart();renderCards();}
function renderCart(){cartList.innerHTML=cart.map((c,i)=>`<li>#${i+1} €${c.p} <button onclick="undo(${i})">Annulla</button></li>`).join('');cartTotal.textContent=cart.reduce((s,c)=>s+c.p,0).toFixed(2);}
