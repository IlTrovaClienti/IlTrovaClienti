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
  contactModal: document.getElementById('contact-modal'),
  closeContact: document.getElementById('close-contact'),
  btnContact:   document.getElementById('btnContactSend'),
  ricarica:     document.querySelector('.ricarica-btn')
};

let leads = [], sectionFilter = 'lead', cart = [];
let filters = { regione: '', citta: '', categoria: '', tipo: '' };

// Utility trova indice colonna ignorando accenti/maiuscole/spazi
function findCol(map, alternatives) {
  const norm = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'').toLowerCase();
  for (const alt of alternatives) {
    for (const col in map) {
      if (norm(col) === norm(alt)) return map[col];
    }
  }
  return -1;
}

// MODALE RICARICA (pulsanti più piccoli e con icone)
function showRicaricaModal() {
  if (!document.getElementById('modal-ricarica')) {
    const modal = document.createElement('div');
    modal.id = 'modal-ricarica';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal" style="min-width:270px;max-width:340px;">
        <h2>Ricarica crediti</h2>
        <h3><img src="assets/credit-card.png" style="width:26px;vertical-align:middle;margin-right:4px;"> Paga con carta</h3>
        <p>1 credito = 40 €</p>
        <a href="https://checkout.revolut.com/pay/c1577ed9-ee74-4268-ac53-234f2c52a43d"
           target="_blank"
           class="ricarica-action btn-card"
           style="display:block;width:100%;padding:10px 0;margin:8px 0 16px 0;border-radius:24px;font-size:1.05em;">Paga ora con carta</a>
        <h3><img src="assets/paypal.png" style="width:26px;vertical-align:middle;margin-right:4px;"> Paga con PayPal</h3>
        <p>1 credito = 40 €</p>
        <a href="https://www.paypal.com/ncp/payment/Y6Y4SS52MZC4Y"
           target="_blank"
           class="ricarica-action btn-paylink"
           style="display:block;width:100%;padding:10px 0;margin:8px 0;border-radius:24px;font-size:1.05em;">Paga ora con PayPal</a>
        <button id="close-ricarica" class="cancel-form" style="margin-top:16px;">Chiudi</button>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('close-ricarica').onclick = () => { modal.remove(); };
    // Chiudi anche con ESC/click fuori
    modal.onclick = e => { if(e.target === modal) modal.remove(); };
    document.addEventListener('keydown', function handler(ev){
      if(ev.key==="Escape"){ modal.remove(); document.removeEventListener('keydown', handler);}
    });
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

    let html = '';
    if (cart.length === 0) {
      html = `<div class="modal">
        <h2>Checkout</h2>
        <p>Devi aggiungere almeno un cliente al carrello.</p>
        <button id="close-checkout" class="cancel-form" style="margin-top:16px;">Chiudi</button>
      </div>`;
    } else {
      // Calcolo riepilogo
      const totale = cart.reduce((s,i)=>s+(i.tipo==='lead'?40:(i.tipo==='appuntamento'?80:0)),0);
      html = `<div class="modal">
        <h2>Checkout</h2>
        <ul style="text-align:left;padding-left:20px;margin:8px 0 12px 0;">
          ${cart.map(item => `<li><b>${item.descrizione}</b> – <span>${item.tipo==='lead'?'1 credito (40 €)':item.tipo==='appuntamento'?'2 crediti (80 €)':'Trattativa riservata'}</span></li>`).join('')}
        </ul>
        <div style="margin:8px 0;font-weight:bold">Totale da pagare: €${totale}</div>
        <div style="margin-bottom:10px;font-size:.9em;">Dopo il pagamento i dati verranno sbloccati.<br>Paga ora:</div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <a href="https://checkout.revolut.com/pay/c1577ed9-ee74-4268-ac53-234f2c52a43d" target="_blank" class="ricarica-action btn-card" style="font-size:1em;padding:8px 20px;">Carta</a>
          <a href="https://www.paypal.com/ncp/payment/Y6Y4SS52MZC4Y" target="_blank" class="ricarica-action btn-paylink" style="font-size:1em;padding:8px 20px;">PayPal</a>
        </div>
        <button id="close-checkout" class="cancel-form" style="margin-top:18px;">Chiudi</button>
      </div>`;
    }
    modal.innerHTML = html;
    document.body.appendChild(modal);
    document.getElementById('close-checkout').onclick = () => { modal.remove(); };
    // Chiudi anche con ESC/click fuori
    modal.onclick = e => { if(e.target === modal) modal.remove(); };
    document.addEventListener('keydown', function handler(ev){
      if(ev.key==="Escape"){ modal.remove(); document.removeEventListener('keydown', handler);}
    });
  } else {
    document.getElementById('modal-checkout').style.display = 'flex';
  }
}

// --- GESTIONE EVENTI “ACQUISISCI”/“RISERVA” CON LOGIN CHECK ---
document.body.addEventListener('click', function(e) {
  // Acquisisci
  if(e.target.classList.contains('acquisisci')) {
    if (!auth.currentUser) {
      elems.authModal.style.display = 'flex';
      return;
    }
    const id = +e.target.dataset.id;
    const item = leads.find(x=>x.id===id);
    if (!cart.find(c=>c.id===id)) {
      cart.push(item);
    }
    render();
  }
  // Riserva → popup trattativa riservata
  if(e.target.classList.contains('riserva')) {
    if (!auth.currentUser) {
      elems.authModal.style.display = 'flex';
      return;
    }
    elems.contactModal.style.display='flex';
  }
});

// Filtri dinamici
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

  // CITTA — SENZA ACCENTO!
  const cittaList = uniqueOptions('citta', leads.filter(l => !filters.regione || l.regione === filters.regione));
  elems.citta.innerHTML = `<option value="">Tutte le Citta</option>` +
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

function filterLeads() {
  return leads.filter(l =>
    (!filters.regione   || l.regione   === filters.regione) &&
    (!filters.citta     || l.citta     === filters.citta) &&
    (!filters.categoria || l.categoria === filters.categoria) &&
    (!filters.tipo      || l.tipo      === filters.tipo) &&
    (sectionFilter === 'tutti' || l.tipo === sectionFilter)
  );
}

// Render cards & cart
function render() {
  const filtered = filterLeads();
  elems.clienti.innerHTML = '';
  filtered.forEach(l => {
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
function toggleButton(btn) {
  elems.btnLeads.classList.remove('selected');
  elems.btnAppuntamenti.classList.remove('selected');
  elems.btnContratti.classList.remove('selected');
  btn.classList.add('selected');
}
elems.btnLeads.onclick = ()=>{ sectionFilter='lead'; toggleButton(elems.btnLeads); render(); };
elems.btnAppuntamenti.onclick = ()=>{ sectionFilter='appuntamento'; toggleButton(elems.btnAppuntamenti); render(); };
elems.btnContratti.onclick = ()=>{ sectionFilter='contratto'; toggleButton(elems.btnContratti); render(); };

// FETCH dati
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

// Modali
elems.checkoutBtn.onclick = ()=> showCheckoutModal();
if(elems.ricarica) elems.ricarica.onclick = (e)=>{ e.preventDefault(); showRicaricaModal(); };

// Auth modal controls
elems.showLogin.onclick = ()=>{
  elems.showLogin.classList.add('active');
  elems.showRegister.classList.remove('active');
  elems.loginForm.classList.add('active');
  elems.registerForm.classList.remove('active');
};
elems.showRegister.onclick = ()=>{
  elems.showLogin.classList.remove('active');
  elems.showRegister.classList.add('active');
  elems.loginForm.classList.remove('active');
  elems.registerForm.classList.add('active');
};
elems.btnLogin.onclick = ()=>{
  const email = document.getElementById('login-email').value;
  const pwd   = document.getElementById('login-password').value;
  const cap   = document.getElementById('login-captcha').value;
  if(cap.trim()!=='5') return alert('Captcha errato');
  auth.signInWithEmailAndPassword(email,pwd)
    .then(()=>{ elems.authModal.style.display='none'; })
    .catch(err=>alert(err.message));
};
elems.btnRegister.onclick = ()=>{
  const email = document.getElementById('register-email').value;
  const pwd   = document.getElementById('register-password').value;
  const pwd2  = document.getElementById('register-password2').value;
  const cap   = document.getElementById('register-captcha').value;
  if(pwd!==pwd2) return alert('Password non corrispondono');
  if(cap.trim()!=='5') return alert('Captcha errato');
  auth.createUserWithEmailAndPassword(email,pwd)
    .then(()=>{ elems.authModal.style.display='none'; })
    .catch(err=>alert(err.message));
};
elems.closeAuth.onclick    = ()=> elems.authModal.style.display='none';
elems.closeContact.onclick = ()=> elems.contactModal.style.display='none';
elems.btnContact.onclick   = ()=> { alert('Richiesta inviata'); elems.contactModal.style.display='none'; };

