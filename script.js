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

// Aggiorna visualizzazione crediti
function aggiornaCreditiDisplay() {
  creditiDisplay.textContent = crediti.toFixed(2);
  euroDisplay.textContent = '€' + (crediti * 40).toFixed(2);
}

// Aggiunge elemento al carrello (solo lead/appuntamento)
function aggiungiAlCarrello(leadId, desc, creditCost, euroCost) {
  if (carrelloState.some(item => item.id === leadId && item.type === desc)) return;
  carrelloState.push({id: leadId, type: desc, euro: euroCost});
  // Trova titolo del lead dal card
  const leadBtn = document.getElementById('btn-lead-' + leadId) || document.getElementById('btn-app-' + leadId);
  let title = leadId;
  if (leadBtn) {
    const card = leadBtn.closest('.cliente');
    const h3 = card.querySelector('h3');
    if (h3) title = h3.textContent;
  }
  const li = document.createElement('li');
  li.textContent = title + ' – ' + desc + ' (€' + euroCost + ')';
  li.dataset.id = leadId;
  li.dataset.type = desc;
  li.dataset.euro = euroCost;

  const btnAnnulla = document.createElement('button');
  btnAnnulla.textContent = 'Annulla';
  btnAnnulla.className = 'annulla';
  btnAnnulla.onclick = () => {
    // rimuovi da stato e UI
    carrello.removeChild(li);
    const idx = carrelloState.findIndex(i => i.id === leadId && i.type === desc);
    if (idx > -1) carrelloState.splice(idx, 1);
    // ripristina crediti
    crediti += creditCost;
    aggiornaCreditiDisplay();
    // riattiva bottoni
    const btnLead = document.getElementById('btn-lead-' + leadId);
    const btnApp = document.getElementById('btn-app-' + leadId);
    if (btnLead) btnLead.disabled = false;
    if (btnApp) btnApp.disabled = false;
    aggiornaTotale();
  };
  li.appendChild(btnAnnulla);
  carrello.appendChild(li);
  aggiornaTotale();
}

// Aggiorna totale carrello
function aggiornaTotale() {
  const totale = carrelloState.reduce((sum, i) => sum + i.euro, 0);
  totaleDisplay.textContent = '€' + totale.toFixed(2);
}

// Crea card cliente con tre bottoni per lead, appuntamento, contratto
function creaCliente(lead) {
  const id = lead.id;
  const div = document.createElement('div');
  div.className = 'cliente';
  // Contenuti base
  const h3 = document.createElement('h3');
  h3.textContent = lead.categoria + ' – ' + lead.citta;
  const pInfo = document.createElement('p');
  pInfo.textContent = '📍 ' + lead.regione + ' | 💬 ' + lead.tipo;
  const pDescr = document.createElement('p');
  pDescr.className = 'descrizione';
  pDescr.textContent = lead.descrizione || '';
  div.append(h3, pInfo, pDescr);

  // Bottone Lead
  const btnLead = document.createElement('button');
  btnLead.textContent = 'Lead da chiamare (1 credito)';
  btnLead.id = 'btn-lead-' + id;
  btnLead.className = 'acquisisci';
  btnLead.onclick = () => {
    crediti -= 1;
    aggiornaCreditiDisplay();
    aggiungiAlCarrello(id, 'Lead da chiamare', 1, 40);
    btnLead.disabled = true;
    btnApp.disabled = true;
    btnContratto.disabled = true;
  };

  // Bottone Appuntamento
  const btnApp = document.createElement('button');
  btnApp.textContent = 'Appuntamento fissato (2 crediti)';
  btnApp.id = 'btn-app-' + id;
  btnApp.className = 'acquisisci';
  btnApp.onclick = () => {
    crediti -= 2;
    aggiornaCreditiDisplay();
    aggiungiAlCarrello(id, 'Appuntamento fissato', 2, 80);
    btnLead.disabled = true;
    btnApp.disabled = true;
    btnContratto.disabled = true;
  };

  // Bottone Contratto
  const btnContratto = document.createElement('button');
  btnContratto.textContent = 'Contratto (10%)';
  btnContratto.id = 'btn-contratto-' + id;
  btnContratto.className = 'contratto';
  btnContratto.onclick = () => {
    // Disabilita i bottoni ma non tocca crediti o carrello
    btnLead.disabled = true;
    btnApp.disabled = true;
    btnContratto.disabled = true;
  };

  div.append(btnLead, btnApp, btnContratto);
  clientiContainer.appendChild(div);
}

// Funzione per popolare dropdown
function popolaDropdown(selectId, leads, key) {
  const select = document.getElementById(selectId);
  const unici = Array.from(new Set(leads.map(l => l[key]))).sort();
  unici.forEach(val => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = val;
    select.appendChild(opt);
  });
}

// Inizializzazione dati
window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(res => res.text())
    .then(text => {
      const lines = text.trim().split('\n');
      if (lines.length < 2) return;
      const headerCells = lines.shift().split('\t').map(h => h.trim());
      // Indici colonne
      const findIdx = (pattern) => headerCells.findIndex(h =>
        h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').startsWith(pattern)
      );
      const idxReg = findIdx('regione');
      const idxCitt = findIdx('citta');
      const idxCat = findIdx('categoria');
      const idxTip = findIdx('tipo');
      const idxDesc = findIdx('descrizione');

      // Mappatura dati
      const dataRows = lines.map(r => r.split('\t'));
      const leads = dataRows.map((cells, i) => ({
        id: 'lead-' + i,
        regione: cells[idxReg] ? cells[idxReg].trim() : '',
        citta: cells[idxCitt] ? cells[idxCitt].trim() : '',
        categoria: cells[idxCat] ? cells[idxCat].trim() : '',
        tipo: cells[idxTip] ? cells[idxTip].trim() : '',
        descrizione: cells[idxDesc] ? cells[idxDesc].trim() : ''
      }));

      // Popola dropdown (Regione, Città, Categoria, Tipo)
      popolaDropdown('regioneSelect', leads, 'regione');
      popolaDropdown('cittaSelect', leads, 'citta');
      popolaDropdown('categoriaSelect', leads, 'categoria');
      popolaDropdown('tipoSelect', leads, 'tipo');

      // Render dei lead e crediti
      leads.forEach(creaCliente);
      aggiornaCreditiDisplay();
    })
    .catch(err => console.error('Errore caricamento sheet:', err));
});

// Ricarica crediti al click
ricaricaBtn.onclick = () => {
  crediti += 8;
  aggiornaCreditiDisplay();
};