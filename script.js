// URL del foglio Google in formato TSV
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSaX-3LmEul1O2Zv6-_1eyg4bmZBhl6EvfhyD9OiGZZ_jE3yjFwkyuWKRodR3GCvG_wTGx4JnvCIGud/pub?output=tsv';

// Funzione per arrotondare per eccesso alla centinaia
function roundToHundred(num) {
  return Math.ceil(num / 100) * 100;
}

let crediti = 8;
const euroDisplay = document.getElementById('euro');
const creditiDisplay = document.getElementById('crediti');
const clientiContainer = document.getElementById('clientiContainer');
const carrello = document.getElementById('carrello');
const totaleDisplay = document.getElementById('totale');
const ricaricaBtn = document.getElementById('ricaricaCrediti');

const carrelloState = [];

// Aggiorna la visualizzazione dei crediti
function aggiornaCreditiDisplay() {
  creditiDisplay.textContent = crediti.toFixed(2);
  euroDisplay.textContent = '€' + (crediti * 40).toFixed(2);
}

// Aggiunge un lead al carrello
function aggiungiAlCarrello(leadId, prezzo) {
  if (carrelloState.includes(leadId)) return;
  carrelloState.push(leadId);
  const li = document.createElement('li');
  li.textContent = leadId + ' – €' + prezzo;
  li.dataset.prezzo = prezzo;

  const btnAnnulla = document.createElement('button');
  btnAnnulla.textContent = 'Annulla';
  btnAnnulla.className = 'annulla';
  btnAnnulla.onclick = () => {
    carrello.removeChild(li);
    carrelloState.splice(carrelloState.indexOf(leadId), 1);
    const creditCost = prezzo / 40;
    crediti += creditCost;
    aggiornaCreditiDisplay();

    const btnOrig = document.getElementById('btn-' + leadId);
    btnOrig.disabled = false;
    btnOrig.textContent = 'Acquisisci Cliente';
    btnOrig.className = 'acquisisci';
    aggiornaTotale();
  };

  li.appendChild(btnAnnulla);
  carrello.appendChild(li);
  aggiornaTotale();
}

// Aggiorna il totale del carrello
function aggiornaTotale() {
  const totale = carrelloState.reduce((sum, id) => {
    const li = Array.from(carrello.children).find(item => item.textContent.startsWith(id));
    return sum + (li ? parseFloat(li.dataset.prezzo) : 0);
  }, 0);
  totaleDisplay.textContent = '€' + totale.toFixed(2);
}

// Crea il card di un cliente
function creaCliente(lead) {
  const id = lead.id;
  const prezzo = lead.prezzo;

  const div = document.createElement('div');
  div.className = 'cliente';

  const h3 = document.createElement('h3');
  h3.textContent = lead.categoria + ' – ' + lead.citta;
  const pInfo = document.createElement('p');
  pInfo.textContent = '📍 ' + lead.regione + ' | 💬 ' + lead.tipo;

  const pDescr = document.createElement('p');
  pDescr.className = 'descrizione';
  pDescr.textContent = lead.descrizione || '';

  const pBudget = document.createElement('p');
  pBudget.innerHTML = '<strong>Budget:</strong> €' + lead.budget;
  const pPrezzo = document.createElement('p');
  pPrezzo.innerHTML = '<strong>Prezzo Acquisto:</strong> €' + prezzo;

  const btn = document.createElement('button');
  btn.textContent = 'Acquisisci Cliente';
  btn.className = 'acquisisci';
  btn.id = 'btn-' + id;
  btn.onclick = () => {
    const creditCost = prezzo / 40;
    crediti -= creditCost;
    aggiornaCreditiDisplay();
    aggiungiAlCarrello(id, prezzo);
    btn.disabled = true;
    btn.textContent = 'Acquisito';
    btn.className = 'acquisito';
  };

  div.append(h3, pInfo, pDescr, pBudget, pPrezzo, btn);
  clientiContainer.appendChild(div);
}

// Popola un dropdown con valori unici
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

// Carica i dati e inizializza la pagina
window.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL)
    .then(res => res.text())
    .then(text => {
      const righe = text.trim().split('\n');
      const headers = righe.shift().split('\t');
      // Trim e normalizzazione degli header
      const keys = headers.map(h =>
        h.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '').toLowerCase()
      );

      const leads = righe.map((riga, idx) => {
        const vals = riga.split('\t');
        const obj = { id: 'lead-' + idx };
        keys.forEach((k, i) => obj[k] = vals[i] ? vals[i].trim() : '');
        const budgetRaw = parseFloat(obj['budget']) || 0;
        obj.budget = roundToHundred(budgetRaw);
        if (obj['prezzodiacquisto']) {
          obj.prezzo = roundToHundred(parseFloat(obj['prezzodiacquisto']));
        } else {
          obj.prezzo = roundToHundred(budgetRaw * 0.1);
        }
        obj.descrizione = obj['descrizione'] || '';
        return obj;
      });

      // Popola filtri (non modificare)
      popolaDropdown('regioneSelect', leads, 'regione');
      popolaDropdown('cittaSelect', leads, 'citta');
      popolaDropdown('categoriaSelect', leads, 'categoria');
      popolaDropdown('tipoSelect', leads, 'tipo');

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