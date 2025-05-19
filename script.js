// script.js
const SHEET_TSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let leads = [], section='lead', cart=[];

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  fetch(SHEET_TSV).then(r=>r.text()).then(parseData).catch(console.error);
});

function initUI(){
  document.getElementById('btnLeads').onclick = ()=>setSection('lead');
  document.getElementById('btnAppuntamenti').onclick = ()=>setSection('appuntamento');
  document.getElementById('btnContratti').onclick = ()=>setSection('contratto');
  ['filter-region','filter-city','filter-category','filter-type']
    .forEach(id=>document.getElementById(id).addEventListener('change', render));
  document.getElementById('clear-filters').onclick = ()=>{ initFilters(); render(); };
  document.getElementById('btnContactSend').onclick = ()=>{ alert('Richiesta inviata'); close('contact-modal'); };
  document.getElementById('close-contact').onclick = ()=> close('contact-modal');
  document.getElementById('pay-paypal').onclick = ()=> window.open('https://www.paypal.com','_blank');
  document.getElementById('pay-card').onclick   = ()=> window.open('https://checkout.revolut.com','_blank');
  document.getElementById('pay-bank').onclick   = ()=> window.location='ricarica.html';
  document.getElementById('close-payment').onclick = ()=> close('payment-modal');
}

function parseData(txt){
  const rows = txt.trim().split('\n');
  const hdrs = rows.shift().split('\t').map(h=>h.trim());
  leads = rows.map((r,i)=>{
    const cells = r.split('\t');
    let o={}; hdrs.forEach((h,idx)=>o[h]=cells[idx]||'');
    o.Tipo=o.Tipo.toLowerCase(); o.id=i;
    return o;
  });
  initFilters(); render();
}

function initFilters(){
  const map = {'Regione':'filter-region','Città':'filter-city','Categoria':'filter-category','Tipo':'filter-type'};
  for(let key in map){
    const sel = document.getElementById(map[key]);
    sel.innerHTML='<option value="">Tutti</option>';
    [...new Set(leads.map(l=>l[key]))].sort().forEach(v=>sel.add(new Option(v,v)));
  }
}

function setSection(s){
  section=s;
  ['btnLeads','btnAppuntamenti','btnContratti'].forEach(id=>document.getElementById(id).classList.remove('selected'));
  document.getElementById({lead:'btnLeads',appuntamento:'btnAppuntamenti',contratto:'btnContratti'}[s]).classList.add('selected');
  render();
}

function render(){
  const f = ['filter-region','filter-city','filter-category','filter-type'].map(id=>document.getElementById(id).value);
  const cont = document.getElementById('clienti'); cont.innerHTML='';
  leads.filter(l=>l.Tipo===section && (!f[0]||l.Regione===f[0]) && (!f[1]||l.Città===f[1]) && (!f[2]||l.Categoria===f[2]) && (!f[3]||l.Tipo===f[3]))
    .forEach(l=>{
      const card = document.createElement('div');
      card.className=`cliente-card ${l.Tipo}`;
      card.innerHTML=`
        <span class="badge ${l.Tipo}">${l.Tipo==='lead'?'Lead':'Appunt.'}</span>
        <h3>${l.Regione} – ${l.Città}</h3>
        <p>${l.Descrizione}</p>
        <p>Budget: €${l['Budget (€)']}</p>
        <div class="actions">
          <button class="${l.Tipo==='contratto'?'riserva':'acquisisci'} btn">${l.Tipo==='contratto'?'Riserva':'Acquisisci'}</button>
        </div>`;
      card.querySelector('.acquisisci')?.addEventListener('click', ()=>addToCart(l));
      card.querySelector('.riserva')?.addEventListener('click', ()=>open('contact-modal'));
      cont.append(card);
    });
  updateCart();
}

function addToCart(item){ cart.push(item); open('payment-modal'); updateCart(); }
function updateCart(){
  const list = document.getElementById('carrello');
  list.innerHTML=cart.map(i=>`<li>${i.Descrizione} – €${i['Budget (€)']}</li>`).join('');
  const sum = cart.reduce((s,i)=>s+parseFloat(i['Budget (€)']||0),0);
  document.getElementById('totale').textContent=`Totale: €${sum}`;
  document.getElementById('crediti').textContent=cart.length;
  document.getElementById('euro').textContent=`€${cart.length*40}`;
}

function open(id){ document.getElementById(id).classList.add('visible'); }
function close(id){ document.getElementById(id).classList.remove('visible'); }
