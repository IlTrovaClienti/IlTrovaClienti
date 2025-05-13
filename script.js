const sheetURL = 'https://docs.google.com/spreadsheets/d/YOUR_OLD_ID/pub?output=tsv';
let crediti = 8, leads = [], carrello = [], sectionFilter = null;

const elems = {
  credDisp: document.getElementById('crediti'),
  euroDisp: document.getElementById('euro'),
  reg: document.getElementById('regione'),
  cit: document.getElementById('citta'),
  cat: document.getElementById('categoria'),
  tip: document.getElementById('tipo'),
  clienti: document.getElementById('clienti'),
  cart: document.getElementById('carrello'),
  tot: document.getElementById('totale'),
  btnLeads: document.getElementById('btnLeads'),
  btnApp: document.getElementById('btnAppuntamenti'),
  btnContr: document.getElementById('btnContratti'),
  btnRic: document.getElementById('ricarica')
};

function updateCreditUI() {
  elems.credDisp.textContent = crediti.toFixed(2);
  elems.euroDisp.textContent = '€' + (crediti*40).toFixed(2);
}

function populateFilters() {
  const keys = {regione:'regione', citta:'citta', categoria:'categoria', tipo:'tipo'};
  Object.values(keys).forEach(key => {
    const set = [...new Set(leads.map(l=>l[key]).filter(v=>v))].sort();
    const sel = elems[key.slice(0,3)];
    sel.innerHTML = '<option value="">Tutti</option>' + set.map(v=>`<option value="${v}">${v}</option>`).join('');
    sel.onchange = render;
  });
}

function render() {
  elems.clienti.innerHTML = '';
  const chosen = {reg:elems.reg.value, cit:elems.cit.value, cat:elems.cat.value, tip:elems.tip.value};
  leads.forEach(lead => {
    if (sectionFilter && !lead.tipo.toLowerCase().includes(sectionFilter)) return;
    if (chosen.reg && lead.regione!==chosen.reg) return;
    if (chosen.cit && lead.citta!==chosen.cit) return;
    if (chosen.cat && lead.categoria!==chosen.cat) return;
    if (chosen.tip && lead.tipo!==chosen.tip) return;
    // card
    const div = document.createElement('div'); div.className='cliente-card';
    const h3 = document.createElement('h3'); h3.textContent = lead.categoria + ' – ' + lead.citta;
    const p1 = document.createElement('p'); p1.textContent = lead.regione + ' | ' + lead.tipo;
    const budget = document.createElement('p'); budget.textContent = 'Budget: €' + lead.budget;
    // commission
    let cost = lead.tipo.toLowerCase().includes('appuntamento')?2:(lead.tipo.toLowerCase().includes('lead')?1:0);
    let euro = cost*40;
    const comm = document.createElement('p');
    comm.textContent = cost>0?('Commissione: €'+euro+' ('+cost+' '+(cost>1?'crediti':'credito')+')'):'Commissione riservata';
    // actions
    const act = document.createElement('div'); act.className='actions';
    if(cost>0) {
      const btnA = document.createElement('button'); btnA.className = cost>1?'appuntamento':'acquisisci'; btnA.textContent='Acquisisci';
      const btnC = document.createElement('button'); btnC.className='annulla'; btnC.textContent='Annulla'; btnC.style.display='none';
      btnA.onclick = () => {
        crediti -= cost; updateCreditUI();
        carrello.push({id:lead.id,cost,euro}); updateCart();
        btnA.disabled=true; btnC.style.display='inline-block';
      };
      btnC.onclick = () => {
        crediti += cost; updateCreditUI();
        carrello = carrello.filter(item=>item.id!==lead.id); updateCart();
        btnA.disabled=false; btnC.style.display='none';
      };
      act.append(btnA, btnC);
    } else {
      const btnR = document.createElement('button'); btnR.className='contratto'; btnR.textContent='Riserva';
      act.append(btnR);
    }
    div.append(h3, p1, budget, comm, act);
    elems.clienti.append(div);
  });
}

function updateCart() {
  elems.cart.innerHTML = '';
  let sum=0;
  carrello.forEach(item=> {
    sum += item.euro;
    const li = document.createElement('li');
    li.textContent = item.id + ' – €' + item.euro;
    const btn = document.createElement('button'); btn.textContent='Annulla'; btn.className='annulla';
    btn.onclick = () => { /* handled above */ };
    li.append(btn);
    elems.cart.append(li);
  });
  elems.tot.textContent = 'Totale: €'+sum.toFixed(2);
}

window.onload = () => {
  fetch(sheetURL).then(r=>r.text()).then(txt=>{
    const lines = txt.trim().split('\n');
    const hdr = lines.shift().split('\t');
    leads = lines.map((l,i)=>{
      const c=l.split('\t');
      return { id:'lead-'+i, regione:c[0], citta:c[1], categoria:c[2], tipo:c[3], budget:parseFloat(c[4])||0 };
    });
    populateFilters(); render(); updateCreditUI();
  });
  elems.btnLeads.onclick = () => { sectionFilter = sectionFilter==='lead'?null:'lead'; elems.btnLeads.classList.toggle('selected'); render(); };
  elems.btnApp.onclick = () => { sectionFilter = sectionFilter==='appuntamento'?null:'appuntamento'; elems.btnApp.classList.toggle('selected'); render(); };
  elems.btnContr.onclick = () => { sectionFilter = sectionFilter==='contratto'?null:'contratto'; elems.btnContr.classList.toggle('selected'); render(); };
  elems.btnRic.onclick = () => { crediti += 8; updateCreditUI(); };
};
