// script.js
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=tsv';

let crediti = 8, allLeads = [], carrelloState = [];

// DOM elements
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
      };

function aggiornaCreditiDisplay() {
  creditiDisplay.textContent = crediti.toFixed(2);
  euroDisplay.textContent = '€' + (crediti * 40).toFixed(2);
}

function populateFilters(leads) {
  Object.keys(filters).forEach(key => {
    const select = filters[key];
    select.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'Tutti';
    defaultOpt.textContent = { regione:'Tutte le Regioni', citta:'Tutte le Città', categoria:'Tutte le Categorie', tipo:'Tutti i Tipi' }[key];
    select.appendChild(defaultOpt);
    [...new Set(leads.map(l => l[key]).filter(v => v))].sort().forEach(v => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      select.appendChild(o);
    });
    select.onchange = renderLeadsList;
  });
}

function getFilteredLeads() {
  return allLeads.filter(lead => Object.keys(filters).every(k => {
    const val = filters[k].value;
    return val === 'Tutti' || lead[k] === val;
  }));
}

function aggiungiAlCarrello(id, type, credCost, euroCost) {
  if (carrelloState.some(i => i.id === id && i.type === type)) return;
  carrelloState.push({ id, type, euro: euroCost, creditCost: credCost });
  updateCarrelloUI();
}

function removeFromCarrello(id, type) {
  carrelloState = carrelloState.filter(i => !(i.id === id && i.type === type));
  updateCarrelloUI();
}

function updateCarrelloUI() {
  carrello.innerHTML = '';
  carrelloState.forEach(item => {
    const li = document.createElement('li');
    const card = document.getElementById(item.id);
    const title = card ? card.querySelector('h3').textContent : item.id;
    li.textContent = `${title} – ${item.type} (€${item.euro})`;
    const btn = document.createElement('button');
    btn.textContent = 'Annulla'; btn.className = 'annulla';
    btn.onclick = () => {
      crediti += item.creditCost;
      aggiornaCreditiDisplay();
      removeFromCarrello(item.id, item.type);
      renderLeadsList();
      updateCarrelloUI();
    };
    li.appendChild(btn);
    carrello.appendChild(li);
  });
  totaleDisplay.textContent = '€' + carrelloState.reduce((s,i)=>s+i.euro,0).toFixed(2);
}

function creaCliente(lead) {
  const div = document.createElement('div'); div.id = lead.id; div.className = 'cliente';
  const h3 = document.createElement('h3'); h3.textContent = `${lead.categoria} – ${lead.citta}`;
  const pReg = document.createElement('p'); pReg.innerHTML = '<img src="https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png" width="16" style="vertical-align:middle;"/> ' + lead.regione;
  const pTipo = document.createElement('p'); pTipo.textContent = lead.tipo;
  const pBud = document.createElement('p'); pBud.innerHTML = '<strong>Budget:</strong> €' + lead.budget;
  const pPrez = document.createElement('p'); pPrez.innerHTML = '<strong>Commissione IlTrovaClienti:</strong> €' + lead.prezzo.toFixed(2);
  div.append(h3, pReg, pTipo, pBud, pPrez);

  const actions = document.createElement('div'); actions.className = 'actions';
  const t = lead.tipo.toLowerCase();

  // Create buttons
  if (t.includes('lead') || t.includes('appuntamento')) {
    const cost = t.includes('lead') ? {c:1, e:40} : {c:2, e:80};
    const pc = document.createElement('p');
    pc.innerHTML = `<strong>Costo:</strong> ${cost.c} credito${cost.c>1?'i':''} (€${cost.e})`;
    const btnAcq = document.createElement('button');
    btnAcq.textContent = 'Acquisisci'; btnAcq.className = t.includes('lead')?'acquisisci':'appuntamento';
    const btnAnnulla = document.createElement('button');
    btnAnnulla.textContent = 'Annulla'; btnAnnulla.className = 'annulla';
    btnAnnulla.style.display = 'none';
    // acquisisci click
    btnAcq.onclick = () => {
      crediti -= cost.c; aggiornaCreditiDisplay();
      aggiungiAlCarrello(lead.id, t.includes('lead')?'Lead da chiamare':'Appuntamento fissato', cost.c, cost.e);
      btnAcq.disabled = true;
      btnAnnulla.style.display = 'inline-block';
    };
    // annulla click
    btnAnnulla.onclick = () => {
      crediti += cost.c; aggiornaCreditiDisplay();
      removeFromCarrello(lead.id, t.includes('lead')?'Lead da chiamare':'Appuntamento fissato');
      btnAcq.disabled = false;
      btnAnnulla.style.display = 'none';
      renderLeadsList();
      updateCarrelloUI();
    };
    actions.append(pc, btnAcq, btnAnnulla);
  } else if (t.includes('contratto')) {
    const btn = document.createElement('button'); btn.textContent = 'Riserva trattativa'; btn.className = 'contratto';
    btn.onclick = () => {
      const form = document.createElement('form'); form.className = 'contratto-form';
      form.innerHTML = `
        <input type="text" name="nome" placeholder="Il tuo nome" required/>
        <input type="email" name="email" placeholder="La tua email" required/>
        <textarea name="messaggio" placeholder="Dettagli..." rows="4" required></textarea>
        <button type="submit">Invia richiesta</button>`;
      form.onsubmit = e => { e.preventDefault(); alert('Richiesta inviata. Grazie!'); form.remove(); };
      div.appendChild(form); btn.disabled = true;
    };
    actions.append(btn);
  }

  div.appendChild(actions);
  return div;
}

function renderLeadsList() {
  clientiContainer.innerHTML = '';
  getFilteredLeads().forEach(l => clientiContainer.appendChild(creaCliente(l)));
}

window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL).then(r=>r.text()).then(txt => {
    const lines = txt.trim().split('\n');
    const headers = lines.shift().split('\t').map(h=>h.trim());
    const idx = {
      regione: headers.findIndex(h=>/region/i.test(h)),
      citta:   headers.findIndex(h=>/citt/i.test(h)),
      categoria: headers.findIndex(h=>/categ/i.test(h)),
      tipo:    headers.findIndex(h=>/tip/i.test(h)),
      budget:  headers.findIndex(h=>/budget/i.test(h)),
      prezzo:  headers.findIndex(h=>/prezzo/i.test(h))
    };
    allLeads = lines.map((line,i)=>{ const cells=line.split('\t').map(c=>c.trim()); const raw=parseFloat(cells[idx.budget])||0;
      const acq=parseFloat(cells[idx.prezzo])||Math.ceil(raw*0.1/100)*100;
      return { id:'lead-'+i, regione:cells[idx.regione]||'', citta:cells[idx.citta]||'', categoria:cells[idx.categoria]||'', tipo:cells[idx.tipo]||'', budget:raw, prezzo:Math.ceil(acq/100)*100 }; 
    });
    populateFilters(allLeads);
    renderLeadsList();
    aggiornaCreditiDisplay();
  });
  ricaricaBtn.onclick = () => { crediti += 8; aggiornaCreditiDisplay(); };
});
