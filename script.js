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

// Populate filter selects with default and unique options
function populateFilters(leads) {
  ['regione', 'citta', 'categoria', 'tipo'].forEach(key => {
    const select = document.getElementById(key + 'Select');
    if (!select) return;
    // store default
    const defaultOption = document.createElement('option');
    defaultOption.value = 'Tutti';
    let defaultText = '';
    switch (key) {
      case 'regione': defaultText = 'Tutte le Regioni'; break;
      case 'citta': defaultText = 'Tutte le Città'; break;
      case 'categoria': defaultText = 'Tutte le Categorie'; break;
      case 'tipo': defaultText = 'Tutti i Tipi'; break;
    }
    defaultOption.textContent = defaultText;
    // clear and re-add default
    select.innerHTML = '';
    select.appendChild(defaultOption);
    // unique sorted values
    const uniqueVals = Array.from(new Set(leads.map(l => l[key]).filter(v => v))).sort();
    uniqueVals.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  });
}

// Add to cart and update UI
function aggiungiAlCarrello(leadId, desc, creditCost, euroCost) {
  if (carrelloState.some(item => item.id === leadId && item.type === desc)) return;
  carrelloState.push({id: leadId, type: desc, euro: euroCost, creditCost});
  updateCarrelloUI();
}

// Update cart UI
function updateCarrelloUI() {
  carrello.innerHTML = '';
  carrelloState.forEach(item => {
    const li = document.createElement('li');
    // find corresponding lead title
    const card = document.getElementById(item.id);
    const title = card ? card.querySelector('h3').textContent : item.id;
    li.textContent = title + ' – ' + item.type + ' (€' + item.euro + ')';
    const btn = document.createElement('button');
    btn.textContent = 'Annulla';
    btn.className = 'annulla';
    btn.onclick = () => {
      crediti += item.creditCost;
      aggiornaCreditiDisplay();
      const idx = carrelloState.indexOf(item);
      if (idx > -1) carrelloState.splice(idx, 1);
      renderLeadsList();
      updateCarrelloUI();
    };
    li.appendChild(btn);
    carrello.appendChild(li);
  });
  totaleDisplay.textContent = '€' + carrelloState.reduce((sum, i) => sum + i.euro, 0).toFixed(2);
}

let allLeads = [];

// Create lead card
function creaCliente(lead) {
  const div = document.createElement('div');
  div.className = 'cliente';
  div.id = lead.id;
  const h3 = document.createElement('h3');
  h3.textContent = lead.categoria + ' – ' + lead.citta;
  const pInfo = document.createElement('p');
  pInfo.textContent = '📍 ' + lead.regione + ' | 💬 ' + lead.tipo + ' | 📄 ' + lead.budget;
  const pPrezzo = document.createElement('p');
  pPrezzo.innerHTML = '<strong>Prezzo Acquisto:</strong> €' + lead.prezzo.toFixed(2);
  div.append(h3, pInfo, pPrezzo);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'actions';

  const btnLead = document.createElement('button');
  btnLead.textContent = 'Lead da chiamare (1 credito)';
  btnLead.className = 'acquisisci';
  btnLead.onclick = () => {
    crediti -= 1; aggiornaCreditiDisplay();
    aggiungiAlCarrello(lead.id, 'Lead da chiamare', 1, 40);
    renderLeadsList();
  };

  const btnApp = document.createElement('button');
  btnApp.textContent = 'Appuntamento fissato (2 crediti)';
  btnApp.className = 'appuntamento';
  btnApp.onclick = () => {
    crediti -= 2; aggiornaCreditiDisplay();
    aggiungiAlCarrello(lead.id, 'Appuntamento fissato', 2, 80);
    renderLeadsList();
  };

  const btnContr = document.createElement('button');
  btnContr.textContent = 'Riserva trattativa';
  btnContr.className = 'contratto';
  btnContr.onclick = () => {
    // show form
    const form = document.createElement('form');
    form.className = 'contratto-form';
    form.innerHTML = `
      <input type="text" name="nome" placeholder="Il tuo nome" required/>
      <input type="email" name="email" placeholder="La tua email" required/>
      <textarea name="messaggio" placeholder="Dettagli..." rows="4" required></textarea>
      <button type="submit">Invia richiesta</button>
    `;
    form.onsubmit = e => {
      e.preventDefault();
      alert('Richiesta inviata. Grazie!');
      form.remove();
      renderLeadsList();
    };
    div.appendChild(form);
    btnLead.disabled = true;
    btnApp.disabled = true;
    btnContr.disabled = true;
  };

  actions.append(btnLead, btnApp, btnContr);
  div.appendChild(actions);
  return div;
}

// Render leads
function renderLeadsList() {
  clientiContainer.innerHTML = '';
  allLeads.forEach(lead => {
    const card = creaCliente(lead);
    // disable purchased
    carrelloState.forEach(item => {
      if (item.id === lead.id && (item.type === 'Lead da chiamare' || item.type === 'Appuntamento fissato')) {
        card.querySelectorAll('button.acquisisci, button.appuntamento').forEach(b => b.disabled = true);
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
      allLeads = lines.map((line,i) => {
        const cells = line.split('\t').map(c=>c.trim());
        const rawBudget = parseFloat(cells[idxMap.budget]) || 0;
        const prezzoAcq = parseFloat(cells[idxMap.prezzo]) || Math.ceil(rawBudget*0.1/100)*100;
        return {
          id: 'lead-' + i,
          regione: cells[idxMap.regione] || '',
          citta: cells[idxMap.citta] || '',
          categoria: cells[idxMap.categoria] || '',
          tipo: cells[idxMap.tipo] || '',
          budget: rawBudget,
          prezzo: Math.ceil(prezzoAcq/100)*100
        };
      });
      // populate filters and render
      populateFilters(allLeads);
      renderLeadsList();
      aggiornaCreditiDisplay();
    })
    .catch(err => console.error('Errore caricamento sheet:', err));
});

// Reload credits
ricaricaBtn.onclick = () => { crediti += 8; aggiornaCreditiDisplay(); };
