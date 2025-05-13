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
    const card = document.createElement('div'); card.className='cliente-card';
    card.innerHTML = `
      <h3>${lead.categoria} – ${lead.citta}</h3>
      <p>${lead.regione} | ${lead.tipo}</p>
      <p class="desc">${lead.descrizione}</p>
      <p class="tel">📞 ${lead.telefono}</p>
      <p>Budget: €${lead.budget}</p>
      <p class="commission">${lead.costCredit>0?`Commissione: €${lead.costCredit*40} (${lead.costCredit} ${lead.costCredit>1?'crediti':'credito'})`:'Commissione riservata'}</p>
    `;
    const act = document.createElement('div'); act.className='actions';
    if(lead.costCredit>0) {
      const btnA=document.createElement('button'); btnA.className='acquisisci'; btnA.textContent='Acquisisci';
      const btnC=document.createElement('button'); btnC.className='annulla'; btnC.textContent='Annulla'; btnC.style.display='none';
      btnA.onclick=()=>{
        crediti-=lead.costCredit; updateCreditUI();
        carrello.push(lead); updateCart();
        btnA.disabled=true; btnC.style.display='inline-block';
      };
      btnC.onclick=()=>{
        crediti+=lead.costCredit; updateCreditUI();
        carrello=carrello.filter(l=>l.id!==lead.id); updateCart();
        btnA.disabled=false; btnC.style.display='none';
      };
      act.append(btnA, btnC);
    } else {
      const btnR=document.createElement('button'); btnR.className='contratto'; btnR.textContent='Riserva trattativa';
      btnR.onclick=()=>{
        const overlay=document.createElement('div'); overlay.className='modal-overlay';
        const modal=document.createElement('div'); modal.className='modal';
        modal.innerHTML=`
          <h3>Riserva Trattativa</h3>
          <form class="contratto-form">
            <input type="text" name="nome" placeholder="Nome e cognome" required/>
            <input type="email" name="email" placeholder="E-mail" required/>
            <input type="tel" name="telefono" placeholder="Telefono" required/>
            <input type="text" name="localita" placeholder="Località" required/>
            <textarea name="messaggio" placeholder="Messaggio" rows="4" required></textarea>
            <div class="form-actions">
              <button type="submit">Invia richiesta</button>
              <button type="button" class="cancel-form">Annulla</button>
            </div>
          </form>`;
        overlay.appendChild(modal); document.body.appendChild(overlay);
        overlay.querySelector('.cancel-form').onclick=()=>{
          document.body.removeChild(overlay);
        };
        overlay.querySelector('.contratto-form').onsubmit=e=>{
          e.preventDefault(); alert('Richiesta inviata!'); document.body.removeChild(overlay);
        };
      };
      act.append(btnR);
    }
    card.append(act); elems.clienti.append(card);
  });
}

function updateCart() {
  elems.cart.innerHTML=''; let sum=0;
  carrello.forEach(item=>{
    sum+=item.costCredit*40;
    const li=document.createElement('li'); li.textContent=`${item.id} – €${item.costCredit*40}`;
    const btn=document.createElement('button'); btn.className='annulla'; btn.textContent='Annulla'; btn.onclick=()=>render();
    li.append(btn); elems.cart.append(li);
  });
  elems.tot.textContent='Totale: €'+sum;
}

window.onload=()=>{
  fetch(sheetURL).then(r=>r.text()).then(txt=>{
    const lines=txt.trim().split('\n'); const headers=lines.shift().split('\t').map(h=>h.trim().toLowerCase());
    const idx={regione:headers.indexOf('regione'), citta:headers.indexOf('città')>=0?headers.indexOf('città'):headers.indexOf('citta'),
               categoria:headers.indexOf('categoria'), tipo:headers.indexOf('tipo'), descrizione:headers.indexOf('descrizione'),
               telefono:headers.indexOf('telefono'), budget:headers.findIndex(h=>h.includes('budget')),
               costCredit:headers.findIndex(h=>h.includes('costo'))};
    leads=lines.map((l,i)=>{
      const c=l.split('\t'); return {id:'lead-'+i,regionе:c[idx.regione]||'',citta:c[idx.citta]||'',categoria:c[idx.categoria]||'',
        tipo:c[idx.tipo]||'',descrizione:c[idx.descrizione]||'',telefono:c[idx.telefono]||'',budget:parseInt(c[idx.budget])||0,
        costCredit:parseInt(c[idx.costCredit])||0};
    });
    populateFilters(); render(); updateCreditUI();
  }).catch(e=>console.error(e));
  elems.btnLeads.onclick=()=>{sectionFilter=sectionFilter==='lead'?null:'lead'; elems.btnLeads.classList.toggle('selected'); render();};
  elems.btnApp.onclick=()=>{sectionFilter=sectionFilter==='appuntamento'?null:'appuntamento'; elems.btnApp.classList.toggle('selected'); render();};
  elems.btnContr.onclick=()=>{sectionFilter=sectionFilter==='contratto'?null:'contratto'; elems.btnContr.classList.toggle('selected'); render();};
  elems.btnRic.onclick=()=>{crediti+=8; updateCreditUI();};
};
