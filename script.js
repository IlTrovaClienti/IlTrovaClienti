// URL del foglio Google in formato TSV
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=tsv';

let crediti = 8;
const euroDisplay = document.getElementById('euro');
const creditiDisplay = document.getElementById('crediti');
const clientiContainer = document.getElementById('clientiContainer');
const carrello = document.getElementById('carrello');
const totaleDisplay = document.getElementById('totale');
const ricaricaBtn = document.getElementById('ricaricaCrediti');
let carrelloState = [];

// Aggiorna display crediti
function aggiornaCreditiDisplay() {
  creditiDisplay.textContent = crediti.toFixed(2);
  euroDisplay.textContent = '€' + (crediti * 40).toFixed(2);
}

// Aggiunge item al carrello
function aggiungiAlCarrello(leadId, desc, creditCost, euroCost) {
  if (carrelloState.some(item => item.id === leadId && item.type === desc)) return;
  carrelloState.push({id: leadId, type: desc, euro: euroCost, creditCost});
  updateCarrelloUI();
}

// Aggiorna UI carrello
function updateCarrelloUI() {
  carrello.innerHTML = '';
  carrelloState.forEach(item => {
    const li = document.createElement('li');
    const card = document.getElementById(item.id);
    const title = card ? card.querySelector('h3').textContent : item.id;
    li.textContent = title + ' – ' + item.type + ' (€' + item.euro + ')';
    const btn = document.createElement('button');
    btn.textContent = 'Annulla';
    btn.className = 'annulla';
    btn.onclick = () => {
      crediti += item.creditCost;
      aggiornaCreditiDisplay();
      carrelloState = carrelloState.filter(i => !(i.id === item.id && i.type === item.type));
      renderLeadsList();
      updateCarrelloUI();
    };
    li.appendChild(btn);
    carrello.appendChild(li);
  });
  totaleDisplay.textContent = '€' + carrelloState.reduce((sum, i) => sum + i.euro, 0).toFixed(2);
}

let allLeads = [];

// Crea card cliente con pulsanti condizionali
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

  // container pulsanti
  const actions = document.createElement('div');
  actions.className = 'actions';

  const tipo = lead.tipo.toLowerCase();
  if (tipo.includes('lead')) {
    // lead da chiamare: 1 credito
    const pCosto = document.createElement('p');
    pCosto.innerHTML = '<strong>Costo:</strong> 1 credito (€40)';
    actions.appendChild(pCosto);
    const btn = document.createElement('button');
    btn.textContent = 'Acquisisci';
    btn.className = 'acquisisci';
    btn.onclick = () => {
      crediti -= 1; aggiornaCreditiDisplay();
      aggiungiAlCarrello(lead.id, 'Lead da chiamare', 1, 40);
      renderLeadsList();
    };
    actions.appendChild(btn);

  } else if (tipo.includes('appuntamento')) {
    // appuntamento fissato: 2 crediti
    const pCosto = document.createElement('p');
    pCosto.innerHTML = '<strong>Costo:</strong> 2 crediti (€80)';
    actions.appendChild(pCosto);
    const btn = document.createElement('button');
    btn.textContent = 'Acquisisci';
    btn.className = 'acquisisci';
    btn.onclick = () => {
      crediti -= 2; aggiornaCreditiDisplay();
      aggiungiAlCarrello(lead.id, 'Appuntamento fissato', 2, 80);
      renderLeadsList();
    };
    actions.appendChild(btn);

  } else if (tipo.includes('contratto')) {
    // contratto: riserva trattativa
    const btn = document.createElement('button');
    btn.textContent = 'Riserva trattativa';
    btn.className = 'contratto';
    btn.onclick = () => {
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
      };
      div.appendChild(form);
      btn.disabled = true;
    };
    actions.appendChild(btn);
  }

  div.appendChild(actions);
  return div;
}

// Rendering leads
function renderLeadsList() {
  clientiContainer.innerHTML = '';
  allLeads.forEach(lead => {
    const card = creaCliente(lead);
    // disabilita acquisiti
    carrelloState.forEach(item => {
      if (item.id === lead.id) {
        card.querySelectorAll('button.acquisisci').forEach(b => b.disabled = true);
      }
    });
    clientiContainer.appendChild(card);
  });
}

// Carica dati e inizializza
window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(r => r.text())
    .then(text => {
      const lines = text.trim().split('\n');
      const headers = lines.shift().split('\t').map(h => h.trim());
      const idx = {
        regione: headers.findIndex(h => /region/i.test(h)),
        citta: headers.findIndex(h => /citt/i.test(h)),
        categoria: headers.findIndex(h => /categ/i.test(h)),
        tipo: headers.findIndex(h => /tip/i.test(h)),
        budget: headers.findIndex(h => /budget/i.test(h)),
        prezzo: headers.findIndex(h => /prezzo/i.test(h))
      };
      allLeads = lines.map((line, i) => {
        const cells = line.split('\t').map(c => c.trim());
        const rawBudget = parseFloat(cells[idx.budget]) || 0;
        const prezzoAcq = parseFloat(cells[idx.prezzo]) || Math.ceil(rawBudget * 0.1 / 100) * 100;
        return {
          id: 'lead-' + i,
          regione: cells[idx.regione] || '',
          citta: cells[idx.citta] || '',
          categoria: cells[idx.categoria] || '',
          tipo: cells[idx.tipo] || '',
          budget: rawBudget,
          prezzo: Math.ceil(prezzoAcq / 100) * 100
        };
      });
      // filtri
      ['regione','citta','categoria','tipo'].forEach(key => {
        const select = document.getElementById(key + 'Select');
        select.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = 'Tutti';
        defaultOpt.textContent = {'regione':'Tutte le Regioni','citta':'Tutte le Città','categoria':'Tutte le Categorie','tipo':'Tutti i Tipi'}[key];
        select.appendChild(defaultOpt);
        Array.from(new Set(allLeads.map(l => l[key]).filter(v => v))).sort().forEach(v => {
          const opt = document.createElement('option'); opt.value = v; opt.textContent = v;
          select.appendChild(opt);
        });
      });
      renderLeadsList();
      aggiornaCreditiDisplay();
    })
    .catch(err => console.error('Errore:', err));
  ricaricaBtn.onclick = () => { crediti += 8; aggiornaCreditiDisplay(); };
});