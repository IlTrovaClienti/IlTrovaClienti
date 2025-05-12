// URL del foglio Google in formato TSV
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=tsv';

let crediti = 8;
const euroDisplay = document.getElementById('euro');
const creditiDisplay = document.getElementById('crediti');
const clientiContainer = document.getElementById('clientiContainer');
const carrello = document.getElementById('carrello');
const totaleDisplay = document.getElementById('totale');
const ricaricaBtn = document.getElementById('ricaricaCrediti');
const carrelloState = [];

// Update credits display
function aggiornaCreditiDisplay() {
  creditiDisplay.textContent = crediti.toFixed(2);
  euroDisplay.textContent = '€' + (crediti * 40).toFixed(2);
}

// Add to cart
function aggiungiAlCarrello(leadId, desc, creditCost, euroCost) {
  if (carrelloState.some(item => item.id === leadId && item.type === desc)) return;
  carrelloState.push({id: leadId, type: desc, euro: euroCost});
  updateCarrelloUI();
}

// Update cart UI
function updateCarrelloUI() {
  carrello.innerHTML = '';
  carrelloState.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.title + ' – ' + item.type + ' (€' + item.euro + ')';
    const btn = document.createElement('button');
    btn.textContent = 'Annulla';
    btn.className = 'annulla';
    btn.onclick = () => {
      crediti += item.creditCost || 0;
      aggiornaCreditiDisplay();
      const idx = carrelloState.indexOf(item);
      carrelloState.splice(idx, 1);
      renderLeadsList(); // re-render leads to reset buttons
      updateCarrelloUI();
    };
    li.appendChild(btn);
    carrello.appendChild(li);
  });
  totaleDisplay.textContent = '€' + carrelloState.reduce((sum,i)=>sum+i.euro,0).toFixed(2);
}

// Create lead card
function creaCliente(lead) {
  const id = lead.id;
  const div = document.createElement('div');
  div.className = 'cliente';
  const h3 = document.createElement('h3');
  h3.textContent = lead.categoria + ' – ' + lead.citta;
  const pInfo = document.createElement('p');
  pInfo.textContent = '📍 ' + lead.regione + ' | 💬 ' + lead.tipo + ' | 📄 ' + lead.budget;
  const pPrezzo = document.createElement('p');
  pPrezzo.innerHTML = '<strong>Prezzo Acquisto:</strong> €' + lead.prezzo.toFixed(2);
  div.append(h3, pInfo, pPrezzo);

  // Actions container
  const actions = document.createElement('div');
  actions.className = 'actions';

  // Lead button
  const btnLead = document.createElement('button');
  btnLead.textContent = 'Lead da chiamare (1 credito)';
  btnLead.className = 'acquisisci';
  btnLead.onclick = () => {
    crediti -= 1; aggiornaCreditiDisplay();
    aggiungiAlCarrello(id, 'Lead da chiamare', 1, 40);
    renderLeadsList(); // update buttons
  };

  // Appointment button
  const btnApp = document.createElement('button');
  btnApp.textContent = 'Appuntamento fissato (2 crediti)';
  btnApp.className = 'appuntamento';
  btnApp.onclick = () => {
    crediti -= 2; aggiornaCreditiDisplay();
    aggiungiAlCarrello(id, 'Appuntamento fissato', 2, 80);
    renderLeadsList();
  };

  // Contract button
  const btnContratto = document.createElement('button');
  btnContratto.textContent = 'Riserva trattativa';
  btnContratto.className = 'contratto';
  btnContratto.onclick = () => {
    // Show contract form
    const form = document.createElement('form');
    form.className = 'contratto-form';
    form.innerHTML = `
      <input type="text" name="nome" placeholder="Il tuo nome" required />
      <input type="email" name="email" placeholder="La tua email" required />
      <textarea name="messaggio" placeholder="Dettagli sulla richiesta" rows="4" required></textarea>
      <button type="submit">Invia richiesta</button>
    `;
    form.onsubmit = e => {
      e.preventDefault();
      alert('Richiesta inviata. Grazie!');
      form.remove();
      renderLeadsList();
    };
    div.appendChild(form);
    btnContratto.disabled = true;
    btnLead.disabled = true;
    btnApp.disabled = true;
  };

  actions.append(btnLead, btnApp, btnContratto);
  div.appendChild(actions);
  return div;
}

// Renders the list of leads (clears and repopulates)
let allLeads = [];
function renderLeadsList() {
  clientiContainer.innerHTML = '';
  allLeads.forEach(lead => {
    const card = creaCliente(lead);
    // disable if in cart
    carrelloState.forEach(item => {
      if (item.id === lead.id && (item.type==='Lead da chiamare' || item.type==='Appuntamento fissato')) {
        card.querySelectorAll('button.acquisisci, button.appuntamento').forEach(b => b.disabled = true);
      }
      if (item.id === lead.id && item.type==='Lead da chiamare') {
        // nothing else
      }
    });
    clientiContainer.appendChild(card);
  });
}

// Load data
window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(res => res.text())
    .then(text => {
      const lines = text.trim().split('\n');
      const headers = lines.shift().split('\t').map(h=>h.trim());
      const idxMap = {
        regione: headers.findIndex(h=>h.toLowerCase().includes('region')),
        citta: headers.findIndex(h=>h.toLowerCase().includes('citt')),
        categoria: headers.findIndex(h=>h.toLowerCase().includes('categ')),
        tipo: headers.findIndex(h=>h.toLowerCase().includes('tip')),
        budget: headers.findIndex(h=>h.toLowerCase().includes('budget')),
        prezzo: headers.findIndex(h=>h.toLowerCase().includes('prezzo'))
      };
      allLeads = lines.map((line,i)=>{
        const cells = line.split('\t').map(c=>c.trim());
        const rawBudget = parseFloat(cells[idxMap.budget])||0;
        const prezzoAcq = parseFloat(cells[idxMap.prezzo])|| Math.ceil(rawBudget*0.1/100)*100;
        return {
          id: 'lead-'+i,
          regione: cells[idxMap.regione]||'',
          citta: cells[idxMap.citta]||'',
          categoria: cells[idxMap.categoria]||'',
          tipo: cells[idxMap.tipo]||'',
          budget: rawBudget,
          prezzo: Math.ceil(prezzoAcq/100)*100
        };
      });
      // Populate filters
      ['regione','citta','categoria','tipo'].forEach(key=>{
        const select = document.getElementById(key+'Select');
        Array.from(new Set(allLeads.map(l=>l[key]))).sort().forEach(v=>{
          const opt = document.createElement('option');
          opt.value = v; opt.textContent = v;
          select.appendChild(opt);
        });
      });
      renderLeadsList();
      aggiornaCreditiDisplay();
    })
    .catch(err=>console.error(err));
});

// Reload credits
ricaricaBtn.onclick = () => { crediti +=8; aggiornaCreditiDisplay(); };