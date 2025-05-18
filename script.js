// URL Google Sheet pubblicato TSV
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

const elems = {
  regione:  document.getElementById('regione'),
  citta:  document.getElementById('citta'),
  categoria:  document.getElementById('categoria'),
  tipo:  document.getElementById('tipo'),
  btnLeads:  document.getElementById('btnLeads'),
  btnAppuntamenti: document.getElementById('btnAppuntamenti'),
  btnContratti:  document.getElementById('btnContratti'),
  clienti:  document.getElementById('clienti'),
  carrello:  document.getElementById('carrello'),
  totale:  document.getElementById('totale'),
  creditiDisp:  document.getElementById('crediti'),
  euroDisp:  document.getElementById('euro'),
  authModal:  document.getElementById('auth-modal'),
  showLogin:  document.getElementById('show-login'),
  showRegister: document.getElementById('show-register'),
  loginForm:  document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  btnLogin:  document.getElementById('btnLogin'),
  btnRegister:  document.getElementById('btnRegister'),
  closeAuth:  document.getElementById('close-auth'),
  checkoutBtn:  document.getElementById('checkout-small'),
  paymentModal: document.getElementById('payment-modal'),
  closePayment: document.getElementById('close-payment'),
  payPaypal:  document.getElementById('pay-paypal'),
  payCard:  document.getElementById('pay-card'),
  payBank:  document.getElementById('pay-bank'),
  contactModal: document.getElementById('contact-modal'),
  closeContact: document.getElementById('close-contact'),
  btnContact:  document.getElementById('btnContactSend')
};

let leads = [], sectionFilter = 'lead', cart = [];

// Toggle tab buttons
function toggleButton(btn) {
  [elems.btnLeads, elems.btnAppuntamenti, elems.btnContratti].forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// Render cards & cart
function render() {
  elems.clienti.innerHTML = '';
  const filtered = leads.filter(l => sectionFilter === 'tutti' || l.tipo === sectionFilter);
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
        <button class="${l.tipo==='contratto'?'riserva':'acquisisci'} btn" data-id="${l.id}">
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
}

// Initial fetch and setup
fetch(sheetURL).then(r=>r.text()).then(txt=>{
  const lines = txt.trim().split('\n');
  const headers = lines.shift().split('\t').map(h=>h.trim().toLowerCase());
  leads = lines.map((l,i)=>{
    const cols = l.split('\t');
    return {
      id: i+1,
      regione: cols[headers.indexOf('regione')],
      citta:  cols[headers.indexOf('città')],
      categoria: cols[headers.indexOf('categoria')],
      tipo:  cols[headers.indexOf('tipo')],
      descrizione: cols[headers.indexOf('descrizione')],
      telefono: cols[headers.indexOf('telefono')],
      budget:  parseFloat(cols[headers.indexOf('budget (€)')])
    };
  });
  populateFilters();
  render();
});

// Populate filters
function populateFilters() {
  const regions = [...new Set(leads.map(l => l.regione))].sort();
  const cities  = [...new Set(leads.map(l => l.citta))].sort();
  const cats    = [...new Set(leads.map(l => l.categoria))].sort();
  const types   = [...new Set(leads.map(l => l.tipo))].sort();
  addOptions(regions, 'regione');
  addOptions(cities, 'citta');
  addOptions(cats, 'categoria');
  addOptions(types,'tipo');
  ['regione','citta','categoria','tipo'].forEach(id=>document.getElementById(id).addEventListener('change', applyFilters));
}

// Add options helper
function addOptions(arr, id) {
  const sel = document.getElementById(id);
  arr.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
  });
}

// Apply filters
function applyFilters() {
  const region   = document.getElementById('regione').value;
  const city     = document.getElementById('citta').value;
  const category = document.getElementById('categoria').value;
  const type     = document.getElementById('tipo').value;
  sectionFilter = 'tutti';
  render();
}

// Event delegation for acquire/reserve/actions
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
elems.showLogin.onclick = ()=>{ toggleTab('login'); };
elems.showRegister.onclick = ()=>{ toggleTab('register'); };
document.getElementById('btnLogin').onclick = login;
document.getElementById('btnRegister').onclick = register;
document.getElementById('close-auth').onclick  = ()=> elems.authModal.style.display='none';

// Payment modal
elems.checkoutBtn.onclick    = ()=> elems.paymentModal.style.display='flex';
elems.payPaypal.onclick      = ()=> window.open('https://www.paypal.com/ncp/payment/Y6Y4SS52MZC4Y');
elems.payCard.onclick        = ()=> window.open('https://checkout.revolut.com/pay/c1577ed9-ee74-4268-ac53-234f2c52a43d');
elems.payBank.onclick        = ()=> window.open('https://iltrovaclienti.github.io/IlTrovaClienti/ricarica.html');
elems.closePayment.onclick   = ()=> elems.paymentModal.style.display='none';

// Contact modal
elems.closeContact.onclick   = ()=> elems.contactModal.style.display='none';
elems.btnContact.onclick     = ()=> { alert('Richiesta inviata'); elems.contactModal.style.display='none'; };

// Helper: toggle auth tabs
function toggleTab(tab) {
  if(tab==='login') {
    elems.showLogin.classList.add('active');
    elems.showRegister.classList.remove('active');
    elems.loginForm.classList.add('active');
    elems.registerForm.classList.remove('active');
  } else {
    elems.showLogin.classList.remove('active');
    elems.showRegister.classList.add('active');
    elems.loginForm.classList.remove('active');
    elems.registerForm.classList.add('active');
  }
}

// Login & register functions
function login(){
  const email = elems.loginForm.querySelector('#login-email').value;
  const pwd   = elems.loginForm.querySelector('#login-password').value;
  const cap   = elems.loginForm.querySelector('#login-captcha').value;
  if(cap.trim() !== '5') return alert('Captcha errato');
  auth.signInWithEmailAndPassword(email,pwd)
    .then(()=> elems.authModal.style.display='none')
    .catch(err=> alert(err.message));
}
function register(){
  const email = elems.registerForm.querySelector('#register-email').value;
  const pwd   = elems.registerForm.querySelector('#register-password').value;
  const pwd2  = elems.registerForm.querySelector('#register-password2').value;
  const cap   = elems.registerForm.querySelector('#register-captcha').value;
  if(pwd !== pwd2) return alert('Password non corrispondono');
  if(cap.trim() !== '5') return alert('Captcha errato');
  auth.createUserWithEmailAndPassword(email,pwd)
    .then(()=> elems.authModal.style.display='none')
    .catch(err=> alert(err.message));
}
