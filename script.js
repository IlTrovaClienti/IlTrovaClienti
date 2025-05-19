// Google Sheet TSV
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
  loginButton:  document.getElementById('login-button'),
  registerButton: document.getElementById('register-button'),
  logoutButton: document.getElementById('logout-button'),
  clearFilters: document.getElementById('clear-filters')
};

let leads = [], sectionFilter = 'lead', cart = [];

// Tab switching
elems.btnLeads.onclick = () => { sectionFilter = 'lead'; render(); };
elems.btnAppuntamenti.onclick = () => { sectionFilter = 'appuntamento'; render(); };
elems.btnContratti.onclick = () => { sectionFilter = 'contratto'; render(); };

// Clear filters
elems.clearFilters.onclick = () => {
  elems.regione.value = '';
  elems.citta.value   = '';
  elems.categoria.value = '';
  elems.tipo.value    = '';
  render();
};

// Fetch & parse TSV
fetch(sheetURL)
  .then(r=>r.text())
  .then(txt=>{
    const lines = txt.trim().split('\n');
    const headers = lines.shift().split('\t').map(h=>h.trim().toLowerCase());
    leads = lines.map((l,i)=>{
      const cols = l.split('\t');
      return {
        id: i+1,
        regione: cols[headers.indexOf('regione')],
        citta: cols[headers.indexOf('città')],
        categoria: cols[headers.indexOf('categoria')],
        tipo: cols[headers.indexOf('tipo')],           // lead|appuntamento|contratto
        descrizione: cols[headers.indexOf('descrizione')],
        budget: parseFloat(cols[headers.indexOf('budget (€)')]) || 0
      };
    });
    populateFilters();
    render();
  });

// Popola dropdown dei filtri
function populateFilters(){
  const uniq = (arr,fn) => [...new Set(arr.map(fn))].filter(v=>v);
  fill(elems.regione, uniq(leads,l=>l.regione));
  fill(elems.citta,   uniq(leads,l=>l.citta));
  fill(elems.categoria,uniq(leads,l=>l.categoria));
  fill(elems.tipo,     uniq(leads,l=>l.tipo));
}
function fill(select, items){
  items.sort().forEach(v=>{
    const o = document.createElement('option');
    o.value = v; o.textContent = v[0].toUpperCase()+v.slice(1);
    select.appendChild(o);
  });
}

// Rendering cards & carrello
function render(){
  elems.clienti.innerHTML = '';
  let filtered = leads.filter(l=>l.tipo === sectionFilter);
  // apply dropdown filters
  ['regione','citta','categoria','tipo'].forEach(f=>{
    const v = elems[f].value;
    if(v) filtered = filtered.filter(l=> l[f] === v);
  });
  if(filtered.length === 0){
    elems.clienti.innerHTML = '<p>Nessun risultato</p>';
  }
  filtered.forEach(l=>{
    const card = document.createElement('div');
    card.className = `cliente-card ${l.tipo}`;
    card.innerHTML = `
      <span class="badge ${l.tipo}">${{
        lead: 'Lead da chiamare',
        appuntamento: 'Appuntamenti fissati',
        contratto: 'Contratti riservati'
      }[l.tipo]}</span>
      <h3>${l.regione} – ${l.citta}</h3>
      <div class="desc">${l.descrizione}</div>
      <div class="budget">Budget: €${l.budget}</div>
      <div class="commission">Commissione: €${(l.budget/40).toFixed(2)}</div>
      <div class="actions">
        <button data-id="${l.id}" class="${l.tipo==='contratto'?'riserva':'acquisisci'}">
          ${l.tipo==='contratto'?'Riserva':'Acquisisci'}
        </button>
      </div>`;
    elems.clienti.appendChild(card);
  });

  // carrello
  elems.carrello.innerHTML = cart.map(i=>`<li>${i.descrizione} – €${i.budget}</li>`).join('');
  const sum = cart.reduce((s,i)=>s+i.budget,0);
  elems.totale.textContent = `Totale: €${sum}`;
  const creds = cart.length>0 ? cart.reduce((s,i)=>s + (i.tipo==='lead'?1:2),0) : 0;
  elems.creditiDisp.textContent = creds;
  elems.euroDisp.textContent    = `€${(creds*40)}`;
}

// Acquisisci/Riserva listener
document.body.addEventListener('click', e=>{
  if(e.target.matches('.acquisisci')){
    if(!auth.currentUser){ elems.authModal.style.display='flex'; return; }
    const item = leads.find(l=>l.id==e.target.dataset.id);
    cart.push(item); render();
  }
  if(e.target.matches('.riserva')){
    elems.contactModal.style.display = 'flex';
  }
});

// AUTH UI
elems.loginButton.onclick = ()=> elems.authModal.style.display='flex';
elems.registerButton.onclick = ()=> elems.authModal.style.display='flex';
elems.logoutButton.onclick = ()=> auth.signOut();

// switch login/register
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

// login
elems.btnLogin.onclick = ()=>{
  const email = elems.loginForm['login-email'].value;
  const pwd   = elems.loginForm['login-password'].value;
  const cap   = elems.loginForm['login-captcha'].value;
  if(cap.trim()!=='5'){ alert('Captcha errato'); return; }
  auth.signInWithEmailAndPassword(email,pwd)
    .then(()=> elems.authModal.style.display='none')
    .catch(e=>alert(e.message));
};
// register
elems.btnRegister.onclick = ()=>{
  const email = elems.registerForm['register-email'].value;
  const pwd   = elems.registerForm['register-password'].value;
  const pwd2  = elems.registerForm['register-password2'].value;
  const cap   = elems.registerForm['register-captcha'].value;
  if(pwd!==pwd2){ alert('Password non corrispondono'); return; }
  if(cap.trim()!=='5'){ alert('Captcha errato'); return; }
  auth.createUserWithEmailAndPassword(email,pwd)
    .then(()=> elems.authModal.style.display='none')
    .catch(e=>alert(e.message));
};
elems.closeAuth.onclick = ()=> elems.authModal.style.display='none';

// checkout
elems.checkoutBtn.onclick = ()=> alert('Implementa checkout');

// pagamento
elems.payPaypal.onclick = ()=> window.open('https://www.paypal.com/ncp/payment/Y6Y4SS52MZC4Y','_blank');
elems.payCard.onclick   = ()=> window.open('https://checkout.revolut.com/pay/c1577ed9-ee74-4268-ac53-234f2c52a43d','_blank');
elems.payBank.onclick   = ()=> window.open('https://iltrovaclienti.github.io/IlTrovaClienti/ricarica.html','_blank');
elems.closePayment.onclick = ()=> elems.paymentModal.style.display='none';

// contatto
elems.btnContact.onclick = ()=> { alert('Richiesta inviata'); elems.contactModal.style.display='none'; };
elems.closeContact.onclick = ()=> elems.contactModal.style.display='none';

// onAuthStateChanged update UI
auth.onAuthStateChanged(u=>{
  if(u){
    elems.loginButton.style.display = 'none';
    elems.registerButton.style.display = 'none';
    elems.logoutButton.style.display = 'inline-block';
  } else {
    elems.loginButton.style.display = 'inline-block';
    elems.registerButton.style.display = 'inline-block';
    elems.logoutButton.style.display = 'none';
  }
});
