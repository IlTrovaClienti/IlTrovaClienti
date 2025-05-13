// script.js - Fix32: Icons and polished UI
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=tsv';

let crediti = 8, allLeads = [], carrelloState = [], sectionFilter = null;

const euroDisplay = document.getElementById('euro'),
      creditiDisplay = document.getElementById('crediti'),
      clientiContainer = document.getElementById('clientiContainer'),
      carrello = document.getElementById('carrello'),
      totaleDisplay = document.getElementById('totale'),
      ricaricaBtn = document.getElementById('ricaricaCrediti'),
      filters = {
        regione: document.getElementById('regioneSelect'),
        citta:   document.getElementById('cittaSelect'),
        categoria: document.getElementById('categoriaSelect'),
        tipo:    document.getElementById('tipoSelect')
      },
      btnLeads = document.getElementById('btnLeads'),
      btnApp = document.getElementById('btnAppuntamenti'),
      btnContr = document.getElementById('btnContratti');

// Map categories to FontAwesome icons
const iconMap = {
  'fotovoltaico': 'fas fa-solar-panel',
  'infissi': 'fas fa-window-restore',
  'serramenti': 'fas fa-door-closed',
  'manutenzione': 'fas fa-tools',
  'ristrutturazione': 'fas fa-home',
  'altro': 'fas fa-concierge-bell'
};

function aggiornaCreditiDisplay() {
  creditiDisplay.textContent = crediti.toFixed(2);
  euroDisplay.textContent = '€' + (crediti * 40).toFixed(2);
}

function populateFilters(leads) {
  Object.keys(filters).forEach(key => {
    const select = filters[key];
    select.innerHTML = '<option value="Tutti">Tutti</option>';
    [...new Set(leads.map(l => l[key]).filter(v => v))].sort().forEach(v => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      select.appendChild(o);
    });
    select.onchange = renderLeadsList;
  });
}

function getFilteredLeads() {
  return allLeads.filter(lead => {
    if (sectionFilter && !lead.tipo.toLowerCase().includes(sectionFilter)) return false;
    return Object.keys(filters).every(k => {
      const val = filters[k].value;
      return val === 'Tutti' || lead[k] === val;
    });
  });
}

function clearSectionButtons() {
  [btnLeads, btnApp, btnContr].forEach(b => b.classList.remove('selected'));
}
btnLeads.onclick = () => { sectionFilter = sectionFilter==='lead'?null:'lead'; clearSectionButtons(); if(sectionFilter) btnLeads.classList.add('selected'); renderLeadsList(); };
btnApp.onclick   = () => { sectionFilter = sectionFilter==='appuntamento'?null:'appuntamento'; clearSectionButtons(); if(sectionFilter) btnApp.classList.add('selected'); renderLeadsList(); };
btnContr.onclick = () => { sectionFilter = sectionFilter==='contratto'?null:'contratto'; clearSectionButtons(); if(sectionFilter) btnContr.classList.add('selected'); renderLeadsList(); };

function aggiungiAlCarrello(id, type, credCost, euroCost) {
  if (!carrelloState.some(i=>i.id===id && i.type===type)) {
    carrelloState.push({id,type,euro:euroCost,creditCost:credCost});
    updateCarrelloUI();
  }
}
function removeFromCarrello(id,type) {
  carrelloState = carrelloState.filter(i=>!(i.id===id && i.type===type));
  updateCarrelloUI();
}
function updateCarrelloUI(){
  carrello.innerHTML='';
  carrelloState.forEach(item=>{ const li=document.createElement('li'); const card=document.getElementById(item.id); const title=card?card.querySelector('h3').textContent:item.id; li.textContent=`${title} – ${item.type} (€${item.euro})`; const btn=document.createElement('button'); btn.textContent='Annulla'; btn.className='annulla'; btn.onclick=()=>{ crediti+=item.creditCost; aggiornaCreditiDisplay(); removeFromCarrello(item.id,item.type); renderLeadsList(); updateCarrelloUI(); }; li.appendChild(btn); carrello.appendChild(li); });
  totaleDisplay.textContent='€'+carrelloState.reduce((s,i)=>s+i.euro,0).toFixed(2);
}

function creaCliente(lead){
  const div=document.createElement('div'); div.id=lead.id; div.className='cliente';
  const catKey = lead.categoria.toLowerCase().split(' ')[0] || 'altro';
  const iconCls = iconMap[catKey] || iconMap['altro'];
  const h3=document.createElement('h3'); h3.innerHTML=`<i class="icon-category ${iconCls}"></i>${lead.categoria} – ${lead.citta}`;

  const pReg=document.createElement('p'); pReg.innerHTML='<i class="fas fa-map-marker-alt"></i> '+lead.regione;
  const pTipo=document.createElement('p'); pTipo.innerHTML='<i class="fas fa-tag"></i> '+lead.tipo;
  const pBud=document.createElement('p'); pBud.innerHTML='<i class="fas fa-euro-sign"></i> Budget: €'+lead.budget;

  // Commission
  const t=lead.tipo.toLowerCase(); let cost={c:0,e:0};
  if(t.includes('lead')) cost={c:1,e:40}; else if(t.includes('appuntamento')) cost={c:2,e:80};
  const pPrez=document.createElement('p');
  if(cost.c>0) pPrez.innerHTML='<i class="fas fa-coins"></i> Commissione: €'+cost.e+' ('+cost.c+' '+(cost.c>1?'crediti':'credito')+')';
  else pPrez.innerHTML='<i class="fas fa-handshake"></i> Commissione: Riservata';

  div.append(h3,pReg,pTipo,pBud,pPrez);

  const floatDiv=document.createElement('div'); floatDiv.className='floating-actions';
  if(cost.c>0){
    const btnAcq=document.createElement('button'); btnAcq.textContent='Acquisisci'; btnAcq.className=cost.c===1?'acquisisci':'appuntamento';
    const btnCancel=document.createElement('button'); btnCancel.textContent='Annulla'; btnCancel.className='annulla'; btnCancel.style.display='none';
    btnAcq.onclick=()=>{
      crediti-=cost.c; aggiornaCreditiDisplay(); aggiungiAlCarrello(lead.id,cost.c===1?'Lead da chiamare':'Appuntamento fissato',cost.c,cost.e);
      btnAcq.disabled=true; btnCancel.style.display='inline-block';
    };
    btnCancel.onclick=()=>{
      crediti+=cost.c; aggiornaCreditiDisplay(); removeFromCarrello(lead.id,cost.c===1?'Lead da chiamare':'Appuntamento fissato');
      btnAcq.disabled=false; btnCancel.style.display='none'; updateCarrelloUI();
    };
    floatDiv.append(btnAcq,btnCancel);
  } else {
    const btn=document.createElement('button'); btn.textContent='Riserva trattativa'; btn.className='contratto';
    btn.onclick=()=>{
      const form=document.createElement('form'); form.className='contratto-form';
      form.innerHTML=`
        <input type="text" name="nome" placeholder="Il tuo nome" required/>
        <input type="email" name="email" placeholder="La tua email" required/>
        <input type="tel" name="telefono" placeholder="Il tuo numero di telefono" required/>
        <input type="text" name="localita" placeholder="La tua località" required/>
        <textarea name="messaggio" placeholder="Dettagli..." rows="4" required></textarea>
        <div class="form-actions"><button type="submit">Invia</button><button type="button" class="cancel-form">Annulla</button></div>`;
      form.querySelector('.cancel-form').onclick=()=>{ form.remove(); btn.disabled=false; };
      form.onsubmit=e=>{ e.preventDefault(); alert('Richiesta inviata'); form.remove(); btn.disabled=false; };
      div.appendChild(form); btn.disabled=true;
    };
    floatDiv.append(btn);
  }
  div.appendChild(floatDiv);
  return div;
}

window.addEventListener('DOMContentLoaded',()=>{
  fetch(sheetURL).then(r=>r.text()).then(txt=>{ const lines=txt.trim().split('\n'); const headers=lines.shift().split('\t').map(h=>h.trim()); const idx={regione:headers.findIndex(h=>/region/i.test(h)),citta:headers.findIndex(h=>/citt/i.test(h)),categoria:headers.findIndex(h=>/categ/i.test(h)),tipo:headers.findIndex(h=>/tip/i.test(h)),budget:headers.findIndex(h=>/budget/i.test(h))}; allLeads=lines.map((line,i)=>{ const c=line.split('\t').map(x=>x.trim()); return{id:'lead-'+i,regione:c[idx.regione]||'',citta:c[idx.citta]||'',categoria:c[idx.categoria]||'',tipo:c[idx.tipo]||'',budget:parseFloat(c[idx.budget])||0};}); populateFilters(allLeads); renderLeadsList(); aggiornaCreditiDisplay(); });
  ricaricaBtn.onclick=()=>{ crediti+=8; aggiornaCreditiDisplay(); };
});
