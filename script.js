// URL Google Sheet pubblicato TSV
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

const elems = {
  regione:      document.getElementById('regione'),
  citta:        document.getElementById('citta'),
  categoria:    document.getElementById('categoria'),
  tipo:         document.getElementById('tipo'),
  btnLeads:     document.getElementById('btnLeads'),
  btnAppuntamenti: document.getElementById('btnAppuntamenti'),
  btnContratti:    document.getElementById('btnContratti'),
  clienti:      document.getElementById('clienti'),
  carrello:     document.getElementById('carrello'),
  totale:       document.getElementById('totale'),
  creditiDisp:  document.getElementById('crediti'),
  euroDisp:     document.getElementById('euro'),
  authModal:    document.getElementById('auth-modal'),
  showLogin:    document.getElementById('show-login'),
  showRegister: document.getElementById('show-register'),
  loginForm:    document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  btnLogin:     document.getElementById('btnLogin'),
  btnRegister:  document.getElementById('btnRegister'),
  closeAuth:    document.getElementById('close-auth'),
  checkoutBtn:  document.getElementById('checkout-small'),
  paymentModal: document.getElementById('payment-modal'),
  closePayment: document.getElementById('close-payment'),
  payPaypal:    document.getElementById('pay-paypal'),
  payCard:      document.getElementById('pay-card'),
  payBank:      document.getElementById('pay-bank'),
  contactModal: document.getElementById('contact-modal'),
  closeContact: document.getElementById('close-contact'),
  btnContact:   document.getElementById('btnContactSend'),
  ricarica:     document.querySelector('.ricarica-btn')
};

let leads = [], sectionFilter = 'lead', cart = [];
let filters = { regione: '', citta: '', categoria: '', tipo: '' };

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

// MODALE RICARICA
function showRicaricaModal() {
  if (!document.getElementById('modal-ricarica')) {
    const modal = document.createElement('div');
    modal.id = 'modal-ricarica';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal">
        <h2>Ricarica crediti</h2>
        <h3>💳 Paga con carta</h3>
        <p>1 credito = 40 €</p>
        <a href="https://checkout.revolut.com/pay/c1577ed9-ee74-4268-ac53-234f2c52a43d" target="_blank" class="ricarica-action btn-card">Paga ora con carta</a>
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

// MODALE CHECKOUT
function showCheckoutModal() {
  if (!document.getElementById('modal-checkout')) {
    const modal = document.createElement('div');
    modal.id = 'modal-checkout';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
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

// POPOLA FILTRI DINAMICI DIPENDENTI
function populateFilters() {
  let subset = leads.filter(l =>
    (!filters.regione   || l.regione   === filters.regione) &&
    (!filters.citta     || l.citta     === filters.citta) &&
    (!filters.categoria || l.categoria === filters.categoria) &&
    (!filters.tipo      || l.tipo      === filters.tipo)
  );

  const uniqueOptions = (field, fromLeads) => [...new Set(fromLeads.map(l => l[field]).filter(Boolean))].sort();

  // REGIONE
  const regioni = uniqueOptions('regione', leads);
  elems.regione.innerHTML = `<option value="">Tutte le Regioni</option>` +
    regioni.map(r=>`<option value="${r}" ${filters.regione===r?'selected':''}>${r}</option>`).join('');

  // CITTA
  const cittaList = uniqueOptions('citta', leads.filter(l => !filters.regione || l.regione === filters.regione));
  elems.citta.innerHTML = `<option value="">Tutte le Città</option>` +
    cittaList.map(c=>`<option value="${c}" ${filters.citta===c?'selected':''}>${c}</option>`).join('');

  // CATEGORIA
  const catList = uniqueOptions('categoria', leads.filter(l =>
    (!filters.regione || l.regione === filters.regione) &&
    (!filters.citta || l.citta === filters.citta)
  ));
  elems.categoria.innerHTML = `<option value="">Tutte le Categorie</option>` +
    catList.map(c=>`<option value="${c}" ${filters.categoria===c?'selected':''}>${c}</option>`).join('');

  // TIPO
  const tipoList = uniqueOptions('tipo', leads.filter(l =>
    (!filters.regione || l.regione === filters.regione) &&
    (!filters.citta || l.citta === filters.citta) &&
    (!filters.categoria || l.categoria === filters.categoria)
  ));
  const tipoLabels = {lead:'Lead da chiamare', appuntamento:'Appuntamenti fissati', contratto:'Contratti riservati'};
  elems.tipo.innerHTML = `<option value="">Tutti i Tipi</option>` +
    tipoList.map(t=>`<option value="${t}" ${filters.tipo===t?'selected':''}>${tipoLabels[t]||t}</option>`).join('');
}

// Applica filtri
function filterLeads() {
  return leads.filter(l =>
    (!filters.regione   || l.regione   === filters.regione) &&
    (!filters.citta     || l.citta     === filters.citta) &&
    (!filters.categoria || l.categoria === filters.categoria) &&
    (!filters.tipo      || l.tipo      === filters.tipo) &&
    (sectionFilter === 'tutti' || l.tipo === sectionFilter)
  );
}

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

    let telefono = `<div class="telefono" style="font-style:italic;color:#999">Visibile dopo acquisizione</div>`;

    const card = document.createElement('div');
    card.className = 'cliente-card ' + l.tipo;
    card.innerHTML = `
      <span class="badge ${l.tipo}">${{
        lead: 'Lead da chiamare',
        appuntamento: 'Appuntamenti fissati',
        contratto: 'Contratti riservati'
      }[l.tipo]}</span>
      <div class="tipo" style="margin-bottom:2px">${l.categoria || 'Intervento'}</div>
      <div class="desc">${l.descrizione}</div>
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

// Aggiorna filtri e renderizza
['regione','citta','categoria','tipo'].forEach(fld=>{
  elems[fld].onchange = ()=>{
    filters[fld] = elems[fld].value;
    if (fld === 'regione') { filters.citta = ''; filters.categoria = ''; filters.tipo = ''; }
    else if (fld === 'citta') { filters.categoria = ''; filters.tipo = ''; }
    else if (fld === 'categoria') { filters.tipo = ''; }
    render();
  };
});

// Tabs
elems.btnLeads.onclick = ()=>{ sectionFilter='lead'; toggleButton(elems.btnLeads); render(); };
elems.btnAppuntamenti.onclick = ()=>{ sectionFilter='appuntamento'; toggleButton(elems.btnAppuntamenti); render(); };
elems.btnContratti.onclick = ()=>{ sectionFilter='contratto'; toggleButton(elems.btnContratti); render(); };

// FETCH dati
fetch(sheetURL).then(r=>r.text()).then(txt=>{
  const lines =
