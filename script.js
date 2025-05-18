document.addEventListener('DOMContentLoaded', () => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
  let crediti = 0, leads = [], carrello = [], loggedIn = false, currentTab = 'lead';
  const users = JSON.parse(localStorage.getItem('users')||'[]');

  // ELEMENTI
  const elems = {
    credDisp:    document.getElementById('crediti'),
    euroDisp:    document.getElementById('euro'),
    regione:     document.getElementById('regione'),
    citta:       document.getElementById('citta'),
    categoria:   document.getElementById('categoria'),
    tipo:        document.getElementById('tipo'),
    clienti:     document.getElementById('clienti'),
    cart:        document.getElementById('carrello'),
    tot:         document.getElementById('totale'),
    btnLeads:    document.getElementById('btnLeads'),
    btnApp:      document.getElementById('btnAppuntamenti'),
    btnContr:    document.getElementById('btnContratti'),
    btnRicarica: document.getElementById('ricarica'),
    checkout:    document.getElementById('checkout-small'),
    // modali
    authModal:   document.getElementById('auth-modal'),
    loginForm:   document.getElementById('login-form'),
    registerForm:document.getElementById('register-form'),
    showLogin:   document.getElementById('show-login'),
    showRegister:document.getElementById('show-register'),
    closeAuth:   document.getElementById('close-auth'),
    paymentModal:document.getElementById('payment-modal'),
    closePay:    document.getElementById('close-payment'),
    contactModal:document.getElementById('contact-modal'),
    closeContact:document.getElementById('close-contact'),
    sendContact: document.getElementById('btnContactSend')
  };

  // AGGIORNA UI CREDITI
  function updateCreditUI() {
    elems.credDisp.textContent = crediti;
    elems.euroDisp.textContent = '€' + (crediti*40);
  }

  // APRI/CHIUDI modali
  function openAuth(tab){
    elems.authModal.style.display='flex';
    if(tab==='register') elems.showRegister.click();
    else elems.showLogin.click();
  }
  function closeAuth(){ elems.authModal.style.display='none'; }
  function openPayment(){ elems.paymentModal.style.display='flex'; }
  function closePayment(){ elems.paymentModal.style.display='none'; }
  function openContact(){ elems.contactModal.style.display='flex'; }
  function closeContact(){ elems.contactModal.style.display='none'; }

  // EVENT LISTENERS modali
  elems.closeAuth.onclick = closeAuth;
  elems.closePay.onclick  = closePayment;
  elems.closeContact.onclick = closeContact;

  elems.showLogin.onclick = ()=>{
    elems.loginForm.classList.add('active');
    elems.registerForm.classList.remove('active');
    elems.showLogin.classList.add('active');
    elems.showRegister.classList.remove('active');
  };
  elems.showRegister.onclick = ()=>{
    elems.registerForm.classList.add('active');
    elems.loginForm.classList.remove('active');
    elems.showRegister.classList.add('active');
    elems.showLogin.classList.remove('active');
  };

  // LOGIN
  document.getElementById('btnLogin').onclick = ()=>{
    const email = document.getElementById('login-email').value.trim();
    const pwd   = document.getElementById('login-password').value;
    const cap   = document.getElementById('login-captcha').value.trim();
    if(!email||!pwd){ alert('Compila tutti i campi'); return; }
    if(cap!=='5'){ alert('Captcha errato'); return; }
    if(users.find(u=>u.email===email && u.pwd===pwd)){
      loggedIn = true; closeAuth(); updateCreditUI(); alert('Login OK');
    } else {
      alert('Credenziali non valide');
    }
  };

  // REGISTRAZIONE
  document.getElementById('btnRegister').onclick = ()=>{
    const name = document.getElementById('register-name').value.trim();
    const surname = document.getElementById('register-surname').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const pwd   = document.getElementById('register-password').value;
    const pwd2  = document.getElementById('register-password2').value;
    const cap   = document.getElementById('register-captcha').value.trim();
    if(!name||!surname||!email||!pwd||!pwd2){ alert('Compila tutti i campi'); return; }
    if(pwd!==pwd2){ alert('Password non corrispondono'); return; }
    if(cap!=='5'){ alert('Captcha errato'); return; }
    users.push({name,surname,email,pwd});
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registrazione OK, ora esegui il login');
    openAuth('login');
  };

  // RICHIESTA CONTATTO
  elems.sendContact.onclick = ()=>{
    const nome = document.getElementById('contact-name').value.trim();
    const cog  = document.getElementById('contact-surname').value.trim();
    const tel  = document.getElementById('contact-phone').value.trim();
    const loc  = document.getElementById('contact-location').value.trim();
    const mail = document.getElementById('contact-email').value.trim();
    const msg  = document.getElementById('contact-message').value.trim();
    if(!nome||!cog||!tel||!loc||!mail||!msg){
      alert('Compila tutti i campi del contatto'); return;
    }
    alert('Richiesta inviata! Ti contatteremo presto.');
    closeContact();
  };

  // NAV TABS
  elems.btnLeads.onclick = ()=>{ currentTab='lead'; switchTab(elems.btnLeads); render(); };
  elems.btnApp.onclick   = ()=>{ currentTab='appuntamento'; switchTab(elems.btnApp); render(); };
  elems.btnContr.onclick = ()=>{ currentTab='contratto'; switchTab(elems.btnContr); render(); };

  function switchTab(btn){
    [elems.btnLeads, elems.btnApp, elems.btnContr].forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
  }

  elems.checkout.onclick = ()=> openAuth('login');
  elems.btnRicarica.onclick = openPayment;

  // CARICA DATI
  fetch(sheetURL).then(r=>r.text()).then(txt=>{
    const lines = txt.trim().split('\n');
    lines.shift(); // header
    leads = lines.map(l=>{
      const c = l.split('\t');
      return {
        regione: c[0]||'',
        citta:   c[1]||'',
        categoria: c[2]||'',
        tipo:    c[3]||'',
        descrizione: c[4]||'',
        budget: parseFloat(c[6])||0
      };
    });
    populateFilters();
    render();
    updateCreditUI();
  });

  function populateFilters(){
    ['regione','citta','categoria','tipo'].forEach(id=>{
      const sel = document.getElementById(id);
      const opts = [...new Set(leads.map(l=>l[id]))].filter(v=>v).sort();
      sel.innerHTML = '<option value="">Tutti</option>' + opts.map(v=>`<option value="${v}">${v}</option>`).join('');
      sel.onchange = render;
    });
  }

  // RENDER
  function render(){
    elems.clienti.innerHTML = '';
    elems.cart.innerHTML    = '';
    elems.tot.textContent   = 'Totale: €0';
    carrello = [];

    const f = {
      regione: elems.regione.value,
      citta:   elems.citta.value,
      categoria: elems.categoria.value,
      tipo:    elems.tipo.value
    };

    leads.forEach(lead => {
      if(!lead.tipo.toLowerCase().includes(currentTab)) return;
      if(f.regione   && lead.regione   !== f.regione)   return;
      if(f.citta     && lead.citta     !== f.citta)     return;
      if(f.categoria && lead.categoria !== f.categoria) return;
      if(f.tipo      && lead.tipo      !== f.tipo)      return;

      const cost = lead.tipo.toLowerCase().includes('appuntamento') ? 2
                 : lead.tipo.toLowerCase().includes('lead')         ? 1 : 0;

      const cls  = cost===1 ? 'lead' : cost===2 ? 'appuntamento' : 'contratto';
      const verb = cost>0 ? 'Acquisisci' : 'Riserva';

      const card = document.createElement('div');
      card.className = 'cliente-card ' + cls;
      card.innerHTML = `
        <div class="badge ${cls}">${lead.tipo}</div>
        <h3>${lead.categoria} – ${lead.citta}</h3>
        <p class="desc">${lead.descrizione}</p>
        <p class="budget">Budget: <strong>€${lead.budget}</strong></p>
        ${cost>0
          ? `<p class="commission">Commissione: €${cost*40} (${cost} crediti)</p>`
          : `<p class="commission">Contatto diretto</p>`
        }
        <div class="actions">
          <button class="${cost>0 ? 'acquisisci' : 'riserva'}">${verb}</button>
        </div>`;

      // gestisci click
      card.querySelector('button').onclick = () => {
        if(cost === 0) {
          openContact();
        } else {
          if(!loggedIn) { openAuth('login'); return; }
          crediti -= cost;
          updateCreditUI();
          carrello.push(lead);
          updateCart();
        }
      };

      elems.clienti.appendChild(card);
    });
  }

  function updateCart(){
    elems.cart.innerHTML = '';
    let sum = 0;
    carrello.forEach(item => {
      const c = item.tipo.toLowerCase().includes('appuntamento') ? 2 : 1;
      sum += c*40;
      const li = document.createElement('li');
      li.textContent = `${item.categoria} – €${c*40}`;
      elems.cart.appendChild(li);
    });
    elems.tot.textContent = 'Totale: €' + sum;
  }

});
