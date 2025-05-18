document.addEventListener('DOMContentLoaded', () => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
  let crediti = 0, leads = [], carrello = [], currentTab = 'lead';
  const auth = firebase.auth();
  let loggedIn = false;

  auth.onAuthStateChanged(user => {
    loggedIn = !!user;
    if(!loggedIn){
      crediti = 0; updateCreditUI(); render();
    }
  });

  const elems = {
    credDisp:document.getElementById('crediti'),
    euroDisp:document.getElementById('euro'),
    regione:document.getElementById('regione'),
    citta:document.getElementById('citta'),
    categoria:document.getElementById('categoria'),
    tipo:document.getElementById('tipo'),
    clienti:document.getElementById('clienti'),
    cart:document.getElementById('carrello'),
    tot:document.getElementById('totale'),
    btnLeads:document.getElementById('btnLeads'),
    btnApp:document.getElementById('btnAppuntamenti'),
    btnContr:document.getElementById('btnContratti'),
    btnRicarica:document.getElementById('ricarica'),
    checkout:document.getElementById('checkout-small'),
    authModal:document.getElementById('auth-modal'),
    loginForm:document.getElementById('login-form'),
    registerForm:document.getElementById('register-form'),
    showLogin:document.getElementById('show-login'),
    showRegister:document.getElementById('show-register'),
    closeAuth:document.getElementById('close-auth'),
    paymentModal:document.getElementById('payment-modal'),
    closePay:document.getElementById('close-payment'),
    contactModal:document.getElementById('contact-modal'),
    closeContact:document.getElementById('close-contact'),
    sendContact:document.getElementById('btnContactSend')
  };

  function updateCreditUI(){
    elems.credDisp.textContent = crediti;
    elems.euroDisp.textContent = '€'+(crediti*40);
  }

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

  elems.closeAuth.onclick = closeAuth;
  elems.closePay.onclick = closePayment;
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

  document.getElementById('btnRegister').onclick = ()=>{
    const name=document.getElementById('register-name').value.trim();
    const surname=document.getElementById('register-surname').value.trim();
    const email=document.getElementById('register-email').value.trim();
    const pwd=document.getElementById('register-password').value;
    const pwd2=document.getElementById('register-password2').value;
    const cap=document.getElementById('register-captcha').value.trim();
    if(!name||!surname||!email||!pwd||!pwd2) return alert('Compila tutti i campi');
    if(pwd!==pwd2) return alert('Le password non corrispondono');
    if(cap!=='5') return alert('Captcha errato');
    auth.createUserWithEmailAndPassword(email,pwd)
      .then(()=>{alert('Registrazione avvenuta, effettua il login.');openAuth('login');})
      .catch(err=>alert(err.message));
  };

  document.getElementById('btnLogin').onclick = ()=>{
    const email=document.getElementById('login-email').value.trim();
    const pwd=document.getElementById('login-password').value;
    const cap=document.getElementById('login-captcha').value.trim();
    if(!email||!pwd) return alert('Compila tutti i campi');
    if(cap!=='5') return alert('Captcha errato');
    auth.signInWithEmailAndPassword(email,pwd)
      .then(()=>{closeAuth();alert('Login eseguito!');})
      .catch(err=>alert(err.message));
  };

  elems.sendContact.onclick = ()=>{
    const n=document.getElementById('contact-name').value.trim();
    const s=document.getElementById('contact-surname').value.trim();
    const t=document.getElementById('contact-phone').value.trim();
    const l=document.getElementById('contact-location').value.trim();
    const m=document.getElementById('contact-email').value.trim();
    const msg=document.getElementById('contact-message').value.trim();
    if(!n||!s||!t||!l||!m||!msg) return alert('Compila tutti i campi');
    alert('Richiesta inviata!');
    closeContact();
  };

  elems.btnLeads.onclick = ()=>{currentTab='lead';switchTab(elems.btnLeads);render();};
  elems.btnApp.onclick   = ()=>{currentTab='appuntamento';switchTab(elems.btnApp);render();};
  elems.btnContr.onclick = ()=>{currentTab='contratto';switchTab(elems.btnContr);render();};
  function switchTab(btn){
    [elems.btnLeads,elems.btnApp,elems.btnContr].forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
  }

  elems.checkout.onclick   = ()=>openAuth('login');
  elems.btnRicarica.onclick= ()=>openPayment();

  fetch(sheetURL).then(r=>r.text()).then(txt=>{
    const lines=txt.trim().split('\n'); lines.shift();
    leads=lines.map(l=>{const c=l.split('\t');return{regione:c[0]||'',citta:c[1]||'',categoria:c[2]||'',tipo:c[3]||'',descrizione:c[4]||'',budget:parseFloat(c[6])||0};});
    populateFilters();render();updateCreditUI();
  });

  function populateFilters(){
    ['regione','citta','categoria','tipo'].forEach(id=>{
      const sel=document.getElementById(id);
      const opts=[...new Set(leads.map(l=>l[id]))].filter(v=>v).sort();
      sel.innerHTML='<option value="">Tutti</option>'+opts.map(v=>`<option value="${v}">${v}</option>`).join('');
      sel.onchange=render;
    });
  }

  function render(){
    elems.clienti.innerHTML='';elems.cart.innerHTML='';elems.tot.textContent='Totale: €0';carrello=[];
    const f={regione:elems.regione.value,citta:elems.citta.value,categoria:elems.categoria.value,tipo:elems.tipo.value};
    leads.forEach(lead=>{
      if(!lead.tipo.toLowerCase().includes(currentTab)) return;
      if(f.regione&&lead.regione!==f.regione) return;
      if(f.citta&&lead.citta!==f.citta) return;
      if(f.categoria&&lead.categoria!==f.categoria) return;
      if(f.tipo&&lead.tipo!==f.tipo) return;
      const cost=lead.tipo.toLowerCase().includes('appuntamento')?2:lead.tipo.toLowerCase().includes('lead')?1:0;
      const cls=cost===1?'lead':cost===2?'appuntamento':'contratto';
      const verb=cost>0?'Acquisisci':'Riserva';
      const card=document.createElement('div');card.className='cliente-card '+cls;
      card.innerHTML=`
        <div class="badge ${cls}">${lead.tipo}</div>
        <h3>${lead.categoria} – ${lead.citta}</h3>
        <p class="desc">${lead.descrizione}</p>
        <p class="budget">Budget: <strong>€${lead.budget}</strong></p>
        ${cost>0?`<p class="commission">Commissione: €${cost*40} (${cost} crediti)</p>`:`<p class="commission">Contatto diretto</p>`}
        <div class="actions"><button class="${cost>0?'acquisisci':'riserva'}">${verb}</button></div>`;
      const btn=card.querySelector('button');
      btn.onclick=()=>{
        if(cost===0){openContact();}else{if(!loggedIn){openAuth('login');return;}crediti-=cost;updateCreditUI();carrello.push(lead);updateCart();}
      };
      elems.clienti.appendChild(card);
    });
  }
  function updateCart(){
    elems.cart.innerHTML='';let sum=0;
    carrello.forEach(item=>{const c=item.tipo.toLowerCase().includes('appuntamento')?2:1;sum+=c*40;const li=document.createElement('li');li.textContent=`${item.categoria} – €${c*40}`;elems.cart.appendChild(li);});
    elems.tot.textContent='Totale: €'+sum;
  }
});
