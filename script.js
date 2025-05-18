document.addEventListener('DOMContentLoaded', () => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
  let crediti = 0, leads = [], carrello = [], sectionFilter = null, loggedIn = false;
  const users = JSON.parse(localStorage.getItem('users') || '[]');

  const elems = {
    credDisp: document.getElementById('crediti'),
    euroDisp: document.getElementById('euro'),
    regione: document.getElementById('regione'),
    citta: document.getElementById('citta'),
    categoria: document.getElementById('categoria'),
    tipo: document.getElementById('tipo'),
    clienti: document.getElementById('clienti'),
    cart: document.getElementById('carrello'),
    tot: document.getElementById('totale'),
    btnLeads: document.getElementById('btnLeads'),
    btnAppuntamenti: document.getElementById('btnAppuntamenti'),
    btnContratti: document.getElementById('btnContratti'),
    btnRicarica: document.getElementById('ricarica'),
    checkoutSmall: document.getElementById('checkout-small'),
    authModal: document.getElementById('auth-modal'),
    paymentModal: document.getElementById('payment-modal'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    closeAuth: document.getElementById('close-auth'),
    showLoginTab: document.getElementById('show-login'),
    showRegisterTab: document.getElementById('show-register')
  };

  function updateCreditUI() {
    elems.credDisp.textContent = crediti.toFixed(2);
    elems.euroDisp.textContent = '€' + (crediti * 40).toFixed(2);
  }
  function openAuth(defaultTab) {
    elems.authModal.style.display = 'flex';
    if (defaultTab === 'login') {
      elems.showLoginTab.click();
    } else {
      elems.showRegisterTab.click();
    }
  }
  function closeAuth() { elems.authModal.style.display = 'none'; }

  elems.closeAuth.onclick = closeAuth;

  // Login/Register tab logic
  elems.showLoginTab.onclick = () => {
    elems.loginForm.classList.add('active');
    elems.registerForm.classList.remove('active');
    elems.showLoginTab.classList.add('active');
    elems.showRegisterTab.classList.remove('active');
  };
  elems.showRegisterTab.onclick = () => {
    elems.loginForm.classList.remove('active');
    elems.registerForm.classList.add('active');
    elems.showLoginTab.classList.remove('active');
    elems.showRegisterTab.classList.add('active');
  };

  // Register logic
  document.getElementById('btnRegister').onclick = () => {
    const name = document.getElementById('register-name').value.trim();
    const surname = document.getElementById('register-surname').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const pwd = document.getElementById('register-password').value;
    const pwd2 = document.getElementById('register-password2').value;
    const captcha = document.getElementById('captcha').value.trim();
    if(!name||!surname||!email||!pwd||!pwd2) { alert('Compila tutti i campi'); return; }
    if(pwd !== pwd2) { alert('Le password non corrispondono'); return; }
    if(captcha !== '5') { alert('Captcha non corretto'); return; }
    users.push({name,surname,email,pwd});
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registrazione ok, effettua il login');
    openAuth('login');
  };

  // Login logic
  document.getElementById('btnLogin').onclick = () => {
    const email = document.getElementById('login-email').value.trim();
    const pwd = document.getElementById('login-password').value;
    if(users.find(u=>u.email===email && u.pwd===pwd)){
      loggedIn = true;
      closeAuth();
      updateCreditUI();
      alert('Login ok');
    } else {
      alert('Credenziali non valide');
    }
  };

  // Section buttons
  elems.btnLeads.onclick = () => { sectionFilter = 'lead'; toggleBtn(elems.btnLeads); render(); };
  elems.btnAppuntamenti.onclick = () => { sectionFilter = 'appuntamento'; toggleBtn(elems.btnAppuntamenti); render(); };
  elems.btnContratti.onclick = () => { sectionFilter = 'contratto'; toggleBtn(elems.btnContratti); render(); };

  function toggleBtn(btn) {
    [elems.btnLeads, elems.btnAppuntamenti, elems.btnContratti].forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
  }

  fetch(sheetURL).then(r=>r.text()).then(txt=>{
    const lines = txt.trim().split('\n');
    const headers = lines.shift().split('\t');
    leads = lines.map((line,i)=>{
      const c=line.split('\t');
      return {id:i, regione:c[0], citta:c[1], categoria:c[2], tipo:c[3], descrizione:c[4], budget:parseFloat(c[6])||0};
    });
    render(); updateCreditUI();
  });

  function render(){
    elems.clienti.innerHTML='';
    elems.cart.innerHTML='';
    elems.tot.textContent='Totale: €0';
    carrello = [];
    leads.forEach(lead=>{
      if(sectionFilter && !lead.tipo.toLowerCase().includes(sectionFilter)) return;
      const cost = lead.tipo.toLowerCase().includes('appuntamento') ? 2 : lead.tipo.toLowerCase().includes('lead') ? 1 : 0;
      const cls = cost===1?'lead':cost===2?'appuntamento':'contratto';
      const card = document.createElement('div'); card.className='cliente-card '+cls;
      card.innerHTML = `<div class="badge ${cls}">${lead.tipo}</div>
        <h3>${lead.categoria} – ${lead.citta}</h3>
        <p>${lead.regione}</p>
        <button class="acquisisci">Acquisisci</button>`;
      card.querySelector('.acquisisci').onclick = () => {
        if(!loggedIn){
          openAuth('login');
        } else {
          // now can add
          crediti += cost;
          updateCreditUI();
          carrello.push(lead);
          // TODO: show cart
        }
      };
      elems.clienti.append(card);
    });
  }

});
