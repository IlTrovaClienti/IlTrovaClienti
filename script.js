
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?gid=71180301&output=tsv";
let rows=[], cart=[], hidden=new Set();

// mapping colonne tollerante
const COL={Regione:['Regione'],Citta:['Città','Citta'],Categoria:['Categoria'],Tipo:['Tipo','Stato']};
const val=(r,keys)=>{for(const k of keys) if(r[k]!==undefined) return r[k]; return '';}

// DOM
const sel={Regione:regioneFilter,Citta:cittaFilter,Categoria:categoriaFilter,Tipo:tipoFilter};
Object.values(sel).forEach(s=>s.onchange=renderCards);
document.querySelectorAll('.tab').forEach(btn=>btn.onclick=e=>{document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));e.currentTarget.classList.add('active');sel.Tipo.value=e.currentTarget.dataset.type;renderCards();});

// Modal Pay
btnRicarica.onclick=()=>{modalMask.classList.remove('hidden');modalPay.classList.remove('hidden');};
closeModal.onclick=()=>{modalMask.classList.add('hidden');modalPay.classList.add('hidden');};
modalMask.onclick=closeModal;

// Crediti demo
let credits=5;const EUR=40;
crediti.textContent=credits;euroCrediti.textContent=(credits*EUR).toFixed(2);

// TSV
fetch(SHEET_URL).then(r=>r.text()).then(t=>{rows=parse(t);initFilters();renderCards();}).catch(console.error);

function parse(tsv){
  const l=tsv.trim().split('\n').map(r=>r.split('\t'));const h=l.shift();
  return l.map((r,i)=>{let o={__id:'r'+i};h.forEach((k,j)=>o[k.trim()]=r[j]||'');return o;});
}
function initFilters(){
  for(const [logic,keys] of Object.entries(COL)){
    const opts=[...new Set(rows.map(r=>val(r,keys)).filter(Boolean))].sort();
    sel[logic].innerHTML='<option value="">Tutti</option>'+opts.map(v=>`<option>${v}</option>`).join('');
  }
}
function renderCards(){
  const f={Regione:sel.Regione.value,Citta:sel.Citta.value,Categoria:sel.Categoria.value,Tipo:sel.Tipo.value};
  const list=rows.filter(r=>(!f.Regione||val(r,COL.Regione)===f.Regione)&&(!f.Citta||val(r,COL.Citta)===f.Citta)&&(!f.Categoria||val(r,COL.Categoria)===f.Categoria)&&(!f.Tipo||val(r,COL.Tipo)===f.Tipo)&&!hidden.has(r.__id));
  cards.innerHTML=list.map(cardHTML).join('');
}
function cardHTML(r){
  const tipo=val(r,COL.Tipo);const cls=tipo==='Lead'?'lead':(tipo==='Appuntamento'?'app':'contr');
  return `<div class="card ${cls}">
    <h4>${r.Descrizione||''}</h4>
    <small>${val(r,COL.Regione)} / ${val(r,COL.Citta)} – ${val(r,COL.Categoria)}</small>
    <button class="btn btn-green" onclick="acq('${r.__id}')">Acquisisci</button>
  </div>`;
}
function acq(id){hidden.add(id);cart.push(id);renderCart();renderCards();}
function undo(i){hidden.delete(cart[i]);cart.splice(i,1);renderCart();renderCards();}
function renderCart(){cartList.innerHTML=cart.map((id,i)=>`<li>#${i+1} <button class="btn btn-grey small" onclick="undo(${i})">Annulla</button></li>`).join('');cartTotal.textContent=cart.length;}
