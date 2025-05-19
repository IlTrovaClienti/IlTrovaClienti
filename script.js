// --- Stessa parte di inizio, unchanged (omesso per brevità) ---
// (fino a const elems = ... e let leads = ... ecc.)

// ... metti qui il codice di "elems" e le altre variabili come sopra

// Mostra popup ricarica
function showRicaricaModal() {
  // Se non esiste, crealo
  if (!document.getElementById('modal-ricarica')) {
    const modal = document.createElement('div');
    modal.id = 'modal-ricarica';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>Ricarica crediti</h2>
        <h3>💳 Paga con carta</h3>
        <p>1 credito = 40 €</p>
        <a href="https://checkout.revolut.com/pay/c1577ed9-ee74-4268-ac53-234f2c52a43d" target="_blank" class="ricarica-action btn-card" style="margin-bottom:8px;">Paga ora con carta</a>
        <h3>🅿️ Paga con PayPal</h3>
        <p>1 credito = 40 €</p>
        <a href="https://www.paypal.com/ncp/payment/Y6Y4SS52MZC4Y" target="_blank" class="ricarica-action btn-paylink">Paga ora con PayPal</a>
        <button id="close-ricarica" class="cancel-form" style="margin-top:16px;">Chiudi</button>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('close-ricarica').onclick = () => { modal.remove(); };
  } else {
    document.getElementById('modal-ricarica').style.display = 'flex';
  }
}

// POPUP checkout
function showCheckoutModal() {
  if (!document.getElementById('modal-checkout')) {
    const modal = document.createElement('div');
    modal.id = 'modal-checkout';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h2>Checkout</h2>
        <p>Funzionalità in arrivo!</p>
        <button id="close-checkout" class="cancel-form" style="margin-top:16px;">Chiudi</button>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('close-checkout').onclick = () => { modal.remove(); };
  } else {
    document.getElementById('modal-checkout').style.display = 'flex';
  }
}

// Trova indice colonna ignorando accenti/maiuscole/spazi
function findCol(map, alternatives) {
  const norm = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'').toLowerCase();
  for (const alt of alternatives) {
    for (const col in map) {
      if (norm(col) === norm(alt)) return map[col];
    }
  }
  return -1;
}

// POPOLA FILTRI DINAMICI DIPENDENTI (come sopra, identico)
function populateFilters() { /* ... */ }
// filterLeads() come sopra

// Render cards & cart (AGGIORNATO)
function render() {
  const filtered = filterLeads();
  elems.clienti.innerHTML = '';
  filtered.forEach(l => {
    // Crediti e costi
    let crediti = '';
    let euro = '';
    if (l.tipo === 'lead') { crediti = '1 credito'; euro = '(40 €)'; }
    else if (l.tipo === 'appuntamento') { crediti = '2 crediti'; euro = '(80 €)'; }
    else if (l.tipo === 'contratto') { crediti = 'Riservato'; euro = ''; }

    const showPhone = cart.includes(l) && auth.currentUser; // puoi gestire meglio
    let telefono = showPhone ? `<div class="telefono">Telefono: ${l.telefono}</div>` : `<div class="telefono" style="font-style:italic;color:#999">Visibile dopo acquisizione</div>`;

    const card = document.createElement('div');
    card.className = 'cliente-card ' + l.tipo;
    card.innerHTML = `
      <span class="badge ${l.tipo}">${{
        lead: 'Lead da chiamare',
        appuntamento: 'Appuntamenti fissati',
        contratto: 'Contratti riservati'
      }[l.tipo]}</span>
      <div class="tipo" style="margin-bottom:2px">${l.categoria || 'Intervento'}</div>
      <div class="desc" style="font-weight:bold;font-style:italic">${l.descrizione}</div>
      <div class="budget">Budget: <b>€${l.budget}</b></div>
      <div class="commission">Commissione: ${crediti} ${euro}</div>
      ${telefono}
      <div class="actions">
        <button class="${l.tipo==='contratto'?'riserva':'acquisisci'}" data-id="${l.id}">
          ${l.tipo==='contratto'?'Riserva':'Acquisisci'}
        </button>
      </div>`;
    elems.clienti.appendChild(card);
  });
  // Carrello
  elems.carrello.innerHTML = cart.map(i=>`<li>${i.descrizione} – €${i.budget}</li>`).join('');
  const sum = cart.reduce((s,i)=>s+i.budget,0);
  elems.totale.textContent = `Totale: €${sum}`;
  elems.creditiDisp.textContent = cart.length>0?cart.reduce((s,i)=>s+(i.tipo==='lead'?1:2),0):0;
  elems.euroDisp.textContent = `€${(cart.length>0?cart.reduce((s,i)=>s+(i.tipo==='lead'?1:2),0)*40:0)}`;
  populateFilters();
}

// --- filtri onchange e tabs uguale a prima ---

// FETCH dati (come sopra, con findCol)
fetch(sheetURL).then(r=>r.text()).then(txt=>{
  const lines = txt.trim().split('\n');
  const headers = lines.shift().split('\t');
  const map = {};
  headers.forEach((h,i)=>map[h]=i);

  const idxRegione     = findCol(map, ['regione']);
  const idxCitta       = findCol(map, ['citta','città']);
  const idxCategoria   = findCol(map, ['categoria']);
  const idxTipo        = findCol(map, ['tipo']);
  const idxDescrizione = findCol(map, ['descrizione']);
  const idxTelefono    = findCol(map, ['telefono']);
  const idxBudget      = findCol(map, ['budget (€)','budget']);

  if ([idxRegione, idxCitta, idxCategoria, idxTipo, idxDescrizione, idxBudget].includes(-1)) {
    elems.clienti.innerHTML = '<div style="color:red;font-weight:bold">ERRORE: Colonne mancanti!</div>';
    return;
  }

  leads = lines.map((l,i)=>{
    const cols = l.split('\t');
    return {
      id: i+1,
      regione: cols[idxRegione] || '',
      citta: cols[idxCitta] || '',
      categoria: cols[idxCategoria] || '',
      tipo: (cols[idxTipo] || '').toLowerCase().replace(/\s.*$/,''),
      descrizione: cols[idxDescrizione] || '',
      telefono: cols[idxTelefono] || '',
      budget: parseFloat(cols[idxBudget]) || 0
    };
  });
  render();
}).catch(err=>{
  elems.clienti.innerHTML = '<div style="color:red">Errore caricamento dati!</div>';
});

// --- Eventi per modali (AGGIORNATO) ---

elems.checkoutBtn.onclick    = ()=> showCheckoutModal();
elems.ricarica && (elems.ricarica.onclick = (e) => {
  e.preventDefault(); showRicaricaModal();
});
// Se usi ancora la vecchia ricarica.html, aggiungi pulsante "indietro" in quella pagina!

// Auth modal controls
// (Uguale ma AGGIORNA i colori con CSS)

