const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
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
  btnRic: document.getElementById('ricarica'),
  payModal: document.getElementById('payment-modal'),
  btnPayPal: document.getElementById('pay-paypal'),
  btnCard: document.getElementById('pay-card'),
  btnBank: document.getElementById('pay-bank'),
  btnClosePay: document.getElementById('close-payment')
};

function updateCreditUI() {
  elems.credDisp.textContent = crediti.toFixed(2);
  elems.euroDisp.textContent = '€' + (crediti*40).toFixed(2);
}

function populateFilters() {
  ['regione','citta','categoria','tipo'].forEach(id => {
    const sel = id==='regione'?elems.reg:id==='citta'?elems.cit:id==='categoria'?elems.cat:elems.tip;
    const values = Array.from(new Set(leads.map(l => l[id]))).sort();
    sel.innerHTML = '<option value="">Tutti</option>' + values.map(v=>`<option value="${v}">${v}</option>`).join('');
    sel.onchange = render;
  });
}

function render() {
  elems.clienti.innerHTML = '';
  const filters = {reg: elems.reg.value, cit: elems.cit.value, cat: elems.cat.value, tip: elems.tip.value};
  leads.forEach(lead => {
    if(sectionFilter && !lead.tipo.toLowerCase().includes(sectionFilter)) return;
    if(filters.reg && lead.regione!==filters.reg) return;
    if(filters.cit && lead.citta!==filters.cit) return;
    if(filters.cat && lead.categoria!==filters.cat) return;
    if(filters.tip && lead.tipo!==filters.tip) return;
    // determine type class and label
    let typeClass = 'contratto', typeLabel = 'Contratto riservato';
    if(lead.costCredit===1) { typeClass='lead'; typeLabel='Lead da chiamare'; }
    else if(lead.costCredit===2) { typeClass='appuntamento'; typeLabel='Appuntamento fissato'; }
    const card = document.createElement('div'); 
    card.className = 'cliente-card ' + typeClass;
    card.innerHTML = `
      <div class="badge ${typeClass}">${typeLabel}</div>
      <h3>${lead.categoria} – ${lead.citta}</h3>
      <p>${lead.regione} | ${lead.tipo}</p>
      <p class="desc">${lead.descrizione}</p>
      <p>Budget: €${lead.budget}</p>
      <p class="commission">${lead.costCredit>0?`Commissione: €${lead.costCredit*40} (${lead.costCredit} ${lead.costCredit>1?'crediti':'credito'})`:'Commissione riservata'}</p>
    `;
    const act = document.createElement('div'); act.className='actions';
    if(lead.costCredit>0) {
      const btnA = document.createElement('button'); btnA.className='acquisisci'; btnA.textContent='Acquisisci';
      const btnC = document.createElement('button'); btnC.className='annulla'; btnC.textContent='Annulla'; btnC.style.display='none';
      btnA.onclick = ()=>{
        crediti -= lead.costCredit; updateCreditUI();
        carrello.push(lead); updateCart();
        btnA.disabled=true; btnC.style.display='inline-block';
      };
      btnC.onclick = ()=>{
        crediti += lead.costCredit; updateCreditUI();
        carrello = carrello.filter(l=>l.id!==lead.id); updateCart();
        btnA.disabled=false; btnC.style.display='none';
      };
      act.append(btnA, btnC);
    } else {
      const btnR = document.createElement('button'); btnR.className='contratto'; btnR.textContent='Riserva trattativa';
      btnR.onclick=()=>{ elems.payModal.style.display='flex'; };
      act.append(btnR);
    }
    card.append(act);
    elems.clienti.append(card);
  });
}

function updateCart() {
  elems.cart.innerHTML=''; let sum=0;
  carrello.forEach(item=>{
    sum += item.costCredit*40;
    const li = document.createElement('li');
    li.textContent = `${item.id} – €${item.costCredit*40}`;
    const btn = document.createElement('button'); btn.className='annulla'; btn.textContent='Annulla'; btn.onclick=()=>render();
    li.append(btn);
    elems.cart.append(li);
  });
  elems.tot.textContent = 'Totale: €'+sum;
}

window.onload = ()=>{
  fetch(sheetURL).then(r=>r.text()).then(txt=>{
    const lines = txt.trim().split('
');
    const headers = lines.shift().split('	').map(h=>h.trim().toLowerCase());
    const idx = {
      regione: headers.indexOf('regione'),
      citta: headers.indexOf('città')>=0?headers.indexOf('città'):headers.indexOf('citta'),
      categoria: headers.indexOf('categoria'),
      tipo: headers.indexOf('tipo'),
      descrizione: headers.indexOf('descrizione'),
      budget: headers.findIndex(h=>h.includes('budget')),
      costCredit: headers.findIndex(h=>h.includes('costo'))
    };
    leads = lines.map((l,i)=>{
      const c = l.split('	');
      return {
        id: 'lead-'+i,
        regione: c[idx.regione]||'',
        citta: c[idx.citta]||'',
        categoria: c[idx.categoria]||'',
        tipo: c[idx.tipo]||'',
        descrizione: c[idx.descrizione]||'',
        budget: parseInt(c[idx.budget])||0,
        costCredit: parseInt(c[idx.costCredit])||0
      };
    });
    populateFilters(); render(); updateCreditUI();
  });
  elems.btnLeads.onclick=()=>{ sectionFilter = sectionFilter==='lead'?null:'lead'; elems.btnLeads.classList.toggle('selected'); render(); };
  elems.btnApp.onclick=()=>{ sectionFilter = sectionFilter==='appuntamento'?null:'appuntamento'; elems.btnApp.classList.toggle('selected'); render(); };
  elems.btnContr.onclick=()=>{ sectionFilter = sectionFilter==='contratto'?null:'contratto'; elems.btnContr.classList.toggle('selected'); render(); };
  // payment handlers
  elems.btnRic.onclick = ()=>{ elems.payModal.style.display='flex'; };
  elems.btnClosePay.onclick = ()=>{ elems.payModal.style.display='none'; };
  elems.btnPayPal.onclick = ()=>{ window.open('https://www.paypal.com/paypalme/YourBusiness','_blank'); };
  elems.btnCard.onclick = ()=>{ window.open('https://your-stripe-checkout-link','_blank'); };
  elems.btnBank.onclick = ()=>{ alert('IBAN: IT00X0000000000000000000000'); };
};
