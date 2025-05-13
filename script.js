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
  btnRic: document.getElementById('ricarica')
};

function updateCreditUI() {
  elems.credDisp.textContent = crediti.toFixed(2);
  elems.euroDisp.textContent = '€' + (crediti*40).toFixed(2);
}

function populateFilters() {
  const fields = ['regione','citta','categoria','tipo'];
  fields.forEach(id => {
    const sel = elems[id.slice(0,3)];
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
    if(filters.reg && lead.regione !== filters.reg) return;
    if(filters.cit && lead.citta !== filters.cit) return;
    if(filters.cat && lead.categoria !== filters.cat) return;
    if(filters.tip && lead.tipo !== filters.tip) return;
    
    const card = document.createElement('div'); card.className = 'cliente-card';
    card.innerHTML = `
      <h3>${lead.categoria} – ${lead.citta}</h3>
      <p>${lead.regione} | ${lead.tipo}</p>
      <p class="desc">${lead.descrizione}</p>
      <p class="tel">📞 ${lead.telefono}</p>
      <p>Budget: €${lead.budget}</p>
      <p class="commission">${lead.costCredit>0 ? `Commissione: €${lead.costCredit*40} (${lead.costCredit} credito${lead.costCredit>1?'i':''})` : 'Commissione riservata'}</p>
    `;
    const act = document.createElement('div'); act.className='actions';
    if(lead.costCredit>0) {
      const btnA = document.createElement('button'); btnA.className='acquisisci'; btnA.textContent='Acquisisci';
      const btnC = document.createElement('button'); btnC.className='annulla'; btnC.textContent='Annulla'; btnC.style.display='none';
      btnA.onclick = () => {
        crediti -= lead.costCredit; updateCreditUI();
        carrello.push(lead); updateCart();
        btnA.disabled=true; btnC.style.display='inline-block';
      };
      btnC.onclick = () => {
        crediti += lead.costCredit; updateCreditUI();
        carrello = carrello.filter(l=>l.id!==lead.id); updateCart();
        btnA.disabled=false; btnC.style.display='none';
      };
      act.append(btnA, btnC);
    } else {
      const btnR = document.createElement('button'); btnR.className='contratto'; btnR.textContent='Riserva trattativa';
      act.append(btnR);
    }
    card.append(act);
    elems.clienti.append(card);
  });
}

function updateCart() {
  elems.cart.innerHTML = '';
  let sum = 0;
  carrello.forEach(item=>{
    sum += item.costCredit*40;
    const li = document.createElement('li');
    li.textContent = `${item.id} – €${item.costCredit*40}`;
    const btn = document.createElement('button'); btn.className='annulla'; btn.textContent='Annulla';
    btn.onclick = () => render();
    li.append(btn);
    elems.cart.append(li);
  });
  elems.tot.textContent = 'Totale: €'+sum;
}

window.onload = () => {
  fetch(sheetURL).then(r=>r.text()).then(txt=>{
    const lines = txt.trim().split('\n');
    lines.shift();
    leads = lines.map((l,i)=>{
      const c = l.split('\t');
      return {
        id: 'lead-'+i,
        regione: c[0],
        citta: c[1],
        categoria: c[2],
        tipo: c[3],
        descrizione: c[4],
        telefono: c[5],
        budget: parseInt(c[6])||0,
        costCredit: isNaN(parseInt(c[7]))?0:parseInt(c[7])
      };
    });
    populateFilters(); render(); updateCreditUI();
  });
  elems.btnLeads.onclick = () => { sectionFilter = sectionFilter==='lead'?null:'lead'; elems.btnLeads.classList.toggle('selected'); render(); };
  elems.btnApp.onclick   = () => { sectionFilter = sectionFilter==='appuntamento'?null:'appuntamento'; elems.btnApp.classList.toggle('selected'); render(); };
  elems.btnContr.onclick = () => { sectionFilter = sectionFilter==='contratto'?null:'contratto'; elems.btnContr.classList.toggle('selected'); render(); };
  elems.btnRic.onclick   = () => { crediti += 8; updateCreditUI(); };
};
