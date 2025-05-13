document.addEventListener('DOMContentLoaded', () => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
  let crediti = 8, leads = [], carrello = [], sectionFilter = null;

  const elems = {
    credDisp: document.getElementById('crediti'),
    euroDisp: document.getElementById('euro'),
    regione: document.getElementById('regione'),
    citta: document.getElementById('citta'),
    categoria: document.getElementById('categoria'),
    tipo: document.getElementById('tipo'),
    clienti: document.getElementById('clienti'),
    cart: document.getElementById('carrello'),
    tot: document.getElementById('totale'),
    btnLeads: document.getElementById('btnLeads'),
    btnAppuntamenti: document.getElementById('btnAppuntamenti'),
    btnContratti: document.getElementById('btnContratti'),
    btnRicarica: document.getElementById('ricarica'),
    payModal: document.getElementById('payment-modal'),
    btnPayPal: document.getElementById('pay-paypal'),
    btnCard: document.getElementById('pay-card'),
    btnBank: document.getElementById('pay-bank'),
    btnClosePay: document.getElementById('close-payment')
  };

  function updateCreditUI() {
    elems.credDisp.textContent = crediti.toFixed(2);
    elems.euroDisp.textContent = '€' + (crediti * 40).toFixed(2);
  }

  function populateFilters() {
    ['regione','citta','categoria','tipo'].forEach(id => {
      const sel = elems[id];
      const values = Array.from(new Set(leads.map(l => l[id]))).filter(v=>v).sort();
      sel.innerHTML = '<option value="">Tutti</option>' + values.map(v=>`<option value="${v}">${v}</option>`).join('');
      sel.onchange = render;
    });
  }

  function render() {
    elems.clienti.innerHTML = '';
    const filters = {
      regione: elems.regione.value,
      citta: elems.citta.value,
      categoria: elems.categoria.value,
      tipo: elems.tipo.value
    };
    leads.forEach(lead => {
      // section filter
      if (sectionFilter && !lead.tipo.toLowerCase().includes(sectionFilter)) return;
      // dropdown filters
      if (filters.regione && lead.regione !== filters.regione) return;
      if (filters.citta && lead.citta !== filters.citta) return;
      if (filters.categoria && lead.categoria !== filters.categoria) return;
      if (filters.tipo && lead.tipo !== filters.tipo) return;
      // type classification
      let typeClass = 'contratto', typeLabel = 'Contratto riservato';
      if (lead.costCredit === 1) { typeClass = 'lead'; typeLabel = 'Lead da chiamare'; }
      else if (lead.costCredit === 2) { typeClass = 'appuntamento'; typeLabel = 'Appuntamento fissato'; }
      // card
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
      // actions
      const act = document.createElement('div'); act.className = 'actions';
      if (lead.costCredit > 0) {
        const btnA = document.createElement('button'); btnA.className='acquisisci'; btnA.textContent='Acquisisci';
        const btnC = document.createElement('button'); btnC.className='annulla'; btnC.textContent='Annulla'; btnC.style.display='none';
        btnA.onclick = () => {
          crediti -= lead.costCredit; updateCreditUI();
          carrello.push(lead); updateCart();
          btnA.disabled = true; btnC.style.display = 'inline-block';
        };
        btnC.onclick = () => {
          crediti += lead.costCredit; updateCreditUI();
          carrello = carrello.filter(l => l.id !== lead.id); updateCart();
          btnA.disabled = false; btnC.style.display = 'none';
        };
        act.append(btnA, btnC);
      } else {
        const btnR = document.createElement('button'); btnR.className='contratto'; btnR.textContent='Riserva trattativa';
        btnR.onclick = () => { elems.payModal.style.display = 'flex'; };
        act.append(btnR);
      }
      card.append(act);
      elems.clienti.append(card);
    });
  }

  function updateCart() {
    elems.cart.innerHTML = ''; let sum = 0;
    carrello.forEach(item => {
      sum += item.costCredit * 40;
      const li = document.createElement('li');
      li.textContent = `${item.id} – €${item.costCredit*40}`;
      const btn = document.createElement('button'); btn.className='annulla'; btn.textContent='Annulla';
      btn.onclick = () => render();
      li.append(btn);
      elems.cart.append(li);
    });
    elems.tot.textContent = 'Totale: €' + sum;
  }

  // payment modal
  elems.btnRicarica.onclick = () => { elems.payModal.style.display = 'flex'; };
  elems.btnClosePay.onclick = () => { elems.payModal.style.display = 'none'; };
  elems.btnPayPal.onclick = () => { window.open('https://www.paypal.com/paypalme/YourBusiness','_blank'); };
  elems.btnCard.onclick = () => { window.open('https://your-stripe-checkout-link','_blank'); };
  elems.btnBank.onclick = () => { alert('IBAN: IT00X0000000000000000000000'); };

  // section toggles
  elems.btnLeads.onclick = () => { sectionFilter = sectionFilter==='lead'?null:'lead'; elems.btnLeads.classList.toggle('selected'); render(); };
  elems.btnAppuntamenti.onclick = () => { sectionFilter = sectionFilter==='appuntamento'?null:'appuntamento'; elems.btnAppuntamenti.classList.toggle('selected'); render(); };
  elems.btnContratti.onclick = () => { sectionFilter = sectionFilter==='contratto'?null:'contratto'; elems.btnContratti.classList.toggle('selected'); render(); };

  // fetch data
  fetch(sheetURL).then(r => r.text()).then(txt => {
    const lines = txt.trim().split('\n');
    const headers = lines.shift().split('\t').map(h => h.trim().toLowerCase());
    const idx = {
      regione: headers.indexOf('regione'),
      citta: headers.indexOf('città') >= 0 ? headers.indexOf('città') : headers.indexOf('citta'),
      categoria: headers.indexOf('categoria'),
      tipo: headers.indexOf('tipo'),
      descrizione: headers.indexOf('descrizione'),
      budget: headers.findIndex(h => h.includes('budget')),
      costCredit: headers.findIndex(h => h.includes('costo'))
    };
    leads = lines.map((l, i) => {
      const c = l.split('\t');
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
    populateFilters();
    render();
    updateCreditUI();
  });
});
