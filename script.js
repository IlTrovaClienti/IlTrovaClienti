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

// Aggiunge elemento al carrello
function aggiungiAlCarrello(leadId, desc, creditCost, euroCost) {
  if (carrelloState.some(item => item.id === leadId && item.type === desc)) return;
  carrelloState.push({id: leadId, type: desc, euro: euroCost});
  const li = document.createElement('li');
  li.textContent = leadId + ' – ' + desc + ' (€' + euroCost + ')';
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
    // riattiva i due bottoni
    const btnLead = document.getElementById('btn-lead-' + leadId);
    const btnApp = document.getElementById('btn-app-' + leadId);
    btnLead.disabled = false; btnApp.disabled = false;
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

// Crea card cliente con due bottoni per lead e appuntamento
function creaCliente(lead) {
  const id = lead.id;
  const div = document.createElement('div');
  div.className = 'cliente';
  // Titolo/info
  const h3 = document.createElement('h3');
  h3.textContent = lead.categoria + ' – ' + lead.citta;
  const pInfo = document.createElement('p');
  pInfo.textContent = '📍 ' + lead.regione + ' | 💬 ' + lead.tipo;
  const pDescr = document.createElement('p');
  pDescr.className = 'descrizione';
  pDescr.textContent = lead.descrizione || '';
  div.append(h3, pInfo, pDescr);

  // Bottoni
  const btnLead = document.createElement('button');
  btnLead.textContent = 'Lead da chiamare (1 credito)';
  btnLead.id = 'btn-lead-' + id;
  btnLead.className = 'acquisisci';
  btnLead.onclick = () => {
    // costa 1 credito = 40€
    crediti -= 1;
    aggiornaCreditiDisplay();
    aggiungiAlCarrello(id, 'Lead da chiamare', 1, 40);
    // disabilita entrambi
    btnLead.disabled = true; btnApp.disabled = true;
  };
  const btnApp = document.createElement('button');
  btnApp.textContent = 'Appuntamento fissato (2 crediti)';
  btnApp.id = 'btn-app-' + id;
  btnApp.className = 'acquisisci';
  btnApp.onclick = () => {
    // costa 2 crediti = 80€
    crediti -= 2;
    aggiornaCreditiDisplay();
    aggiungiAlCarrello(id, 'Appuntamento fissato', 2, 80);
    btnLead.disabled = true; btnApp.disabled = true;
  };

  div.append(btnLead, btnApp);
  clientiContainer.appendChild(div);
}

// Carica dati dal sheet e popola
window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(res => res.text())
    .then(text => {
      const righe = text.trim().split('\n');
      const headers = righe.shift().split('\t');
      const keys = headers.map(h => h.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '').toLowerCase());
      const leads = righe.map((riga, idx) => {
        const vals = riga.split('\t');
        const obj = {id: 'lead-' + idx};
        keys.forEach((k,i) => obj[k] = vals[i] ? vals[i].trim() : '');
        obj.descrizione = obj['descrizione'] || '';
        return obj;
      });
      // city, region, category, type used by filters unchanged
      popolaDropdown('regioneSelect', leads, 'regione');
      popolaDropdown('cittaSelect', leads, 'citta');
      popolaDropdown('categoriaSelect', leads, 'categoria');
      popolaDropdown('tipoSelect', leads, 'tipo');

      leads.forEach(creaCliente);
      aggiornaCreditiDisplay();
    })
    .catch(err => console.error('Errore:', err));
});

// Funzione popola dropdown (unchanged)
function popolaDropdown(selectId, leads, key) {
  const select = document.getElementById(selectId);
  const unici = Array.from(new Set(leads.map(l => l[key]))).sort();
  unici.forEach(val => {
    const opt = document.createElement('option');
    opt.value = val; opt.textContent = val;
    select.appendChild(opt);
  });
}

// Ricarica crediti
ricaricaBtn.onclick = () => {
  crediti += 8;
  aggiornaCreditiDisplay();
};