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
  btnContact:   document.getElementById('btnContactSend')
};

let leads = [], sectionFilter = 'lead', cart = [];
let filters = { regione: '', citta: '', categoria: '', tipo: '' };

// Toggle tab buttons
function toggleButton(btn) {
  elems.btnLeads.classList.remove('selected');
  elems.btnAppuntamenti.classList.remove('selected');
  elems.btnContratti.classList.remove('selected');
  btn.classList.add('selected');
}

// Mapping colonne ultra-tollerante
function normalizeColName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').toLowerCase();
}
function colIdx(map, keys) {
  for (let k of keys) {
    k = normalizeColName(k);
    for (let col in map) {
      if (normalizeColName(col) === k) return map[col];
    }
  }
  return -1;
}

// FILTRI DIPENDENTI
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

  // CITTA (auto rileva "Citta", "Città", "citta", "città")
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

// Render cards & cart
function render() {
  const filtered = filterLeads();
  elems.clienti.innerHTML = '';
  filtered.forEach(l => {
    const card = document.createElement('div');
    card.className = 'cliente-card ' + l.tipo;
    card.innerHTML = `
      <span class="badge ${l.tipo}">${{
        lead: 'Lead da chiamare',
        appuntamento: 'Appuntamenti fissati',
        contratto: 'Contratti riservati'
      }[l.tipo]}</span>
      <h3>${l.regione} – ${l.citta}</h3>
      <div class="desc">${l.descrizione}</div>
      <div class="budget">Budget: €${l.budget}</div>
      <div class="commission">Commissione: €${l.budget/40} (${l.budget/40} crediti)</div>
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

// FETCH dati (mapping universale "Citta" e "Città")
fetch(sheetURL).then(r=>r.text()).then(txt=>{
  const lines = txt.trim().split('\n');
  const headers = lines.shift().split('\t');
  const map = {};
  headers.forEach((h,i)=>map[h]=i);

  // Mappa con priorità: Citta > città > citta > Città
  const idxRegione     = colIdx(map, ['regione']);
  const idxCitta       = colIdx(map, ['citta','città']);
  const idxCategoria   = colIdx(map, ['categoria']);
  const idxTipo        = colIdx(map, ['tipo']);
  const idxDescrizione = colIdx(map, ['descrizione']);
  const idxTelefono    = colIdx(map, ['telefono']);
  const idxBudget      = colIdx(map, ['budget (€)','budget']);

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
  console.error('Errore fetch/parsing dati TSV:', err);
  elems.clienti.innerHTML = '<div style="color:red">Errore caricamento dati!</div>';
});

// Handle “Acquisisci” / “Riserva”
document.body.addEventListener('click', e=>{
  if(e.target.matches('.acquisisci')){
    if(!auth.currentUser) return elems.authModal.style.display='flex';
    const id = +e.target.dataset.id;
    const item = leads.find(x=>x.id===id);
    cart.push(item);
    render();
  }
  if(e.target.matches('.riserva')){
    elems.contactModal.style.display='flex';
  }
});

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
elems.closeAuth.onclick      = ()=> elems.authModal.style.display='none';
elems.checkoutBtn.onclick    = ()=> alert('Implementa checkout');
elems.payPaypal.onclick      = ()=> window.open('https://www.paypal.com/ncp/payment/Y6Y4SS52MZC4Y','_blank');
elems.payCard.onclick        = ()=> window.open('https://checkout.revolut.com/pay/c1577ed9-ee74-4268-ac53-234f2c52a43d','_blank');
elems.payBank.onclick        = ()=> window.open('https://iltrovaclienti.com/ricarica.html','_blank');
elems.closePayment.onclick   = ()=> elems.paymentModal.style.display='none';
elems.closeContact.onclick   = ()=> elems.contactModal.style.display='none';
elems.btnContact.onclick     = ()=> { alert('Richiesta inviata'); elems.contactModal.style.display='none'; };
