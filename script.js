// script.js
const SHEET_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let leads = [], section='lead', cart=[];

document.addEventListener('DOMContentLoaded',()=>{
  initUI();
  fetch(SHEET_TSV).then(r=>r.text()).then(parseData).catch(console.error);
});

function initUI(){
  // Tabs
  document.getElementById('btnLeads').onclick = ()=>setSection('lead');
  document.getElementById('btnAppuntamenti').onclick = ()=>setSection('appuntamento');
  document.getElementById('btnContratti').onclick = ()=>setSection('contratto');
  // Filters
  ['filter-region','filter-city','filter-category','filter-type']
    .forEach(id=>document.getElementById(id).addEventListener('change', render));
  document.getElementById('clear-filters').onclick = ()=>{ initFilters(); render(); };
  // Modals contact/payment
  document.getElementById('btnContactSend').onclick = ()=>{ alert('Richiesta inviata'); close('contact-modal'); };
  document.getElementById('close-contact').onclick = ()=> close('contact-modal');
  document.getElementById('pay-paypal').onclick = ()=>window.open('https://www.paypal.com','_blank');
  document.getElementById('pay-card').onclick   = ()=>window.open('https://checkout.revolut.com','_blank');
  document.getElementById('pay-bank').onclick   = ()=>window.location='ricarica.html';
  document.getElementById('close-payment').onclick = ()=> close('payment-modal');
}

function parseData(txt){
  const rows = txt.trim().split('\n');
  const hdrs = rows.shift().split('\t').map(h=>h.trim());
  leads = rows.map((r,i)=>{
    const cells = r.split('\t');
    const obj = hdrs.reduce((o,h,idx)=>(o[h]=cells[idx],o),{});
    obj.id=i; obj.Tipo = obj.Tipo.toLowerCase();
    return obj;
  });
  initFilters();
  render();
}

function initFilters(){
  const fields = ['Regione','Città','Categoria','Tipo'];
  fields.forEach((f,idx)=>{
    const sel = document.getElementById(['filter-region','filter-city','filter-category','filter-type'][idx]);
    sel.innerHTML = `<option value="">Tutti</option>`;
    [...new Set(leads.map(l=>l[f]))].sort().forEach(v=>sel.add(new Option(v,v)));
  });
}

function setSection(s){
  section=s;
  document.querySelectorAll('.section-buttons .btn').forEach(b=>b.classList.remove('selected'));
  document.getElementById({lead:'btnLeads',appuntamento:'btnAppuntamenti',contratto:'btnContratti'}[s]).classList.add('selected');
  render();
}

function render(){
  const [r,c,cat,t] = ['filter-region','filter-city','filter-category','filter-type'].map(id=>document.getElementById(id).value);
  const cont = document.getElementById('clienti'); cont.innerHTML='';
  const filtered = leads.filter(l=>
    l.Tipo===section &&
    (!r||l.Regione===r) &&
    (!c||l.Città===c) &&
    (!cat||l.Categoria===cat) &&
    (!t||l.Tipo===t)
  );
  filtered.forEach(l=>{
    const card=document.createElement('div'); card.className=`cliente-card ${l.Tipo}`;
    card.innerHTML=`
      <span class="badge ${l.Tipo}">${l.Tipo==='lead'?'Lead':'Appunt.'}</span>
      <h3>${l.Regione} – ${l.Città}</h3>
      <p>${l.Descrizione}</p>
      <p>Budget: €${l.Budget}</p>
      <div class="actions">
        <button class="${l.Tipo==='contratto'?'riserva':'acquisisci'} btn">${l.Tipo==='contratto'?'Riserva':'Acquisisci'}</button>
      </div>`;
    card.querySelector('.acquisisci')?.addEventListener('click',()=>addToCart(l));
    card.querySelector('.riserva')?.addEventListener('click',()=>open('contact-modal'));
    cont.append(card);
  });
  updateCart();
}

function addToCart(item){
  cart.push(item);
  open('payment-modal');
  updateCart();
}

function updateCart(){
  const list = document.getElementById('carrello');
  list.innerHTML = cart.map(i=>`<li>${i.Descrizione} – €${i.Budget}</li>`).join('');
  const sum = cart.reduce((s,i)=>s+parseFloat(i.Budget||0),0);
  document.getElementById('totale').textContent = `Totale: €${sum}`;
  document.getElementById('crediti').textContent = cart.length;
  document.getElementById('euro').textContent = `€${cart.length*40}`;
}

function open(id){document.getElementById(id).classList.add('visible');}
function close(id){document.getElementById(id).classList.remove('visible');}
