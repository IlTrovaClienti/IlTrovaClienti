document.addEventListener('DOMContentLoaded', () => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
  let crediti = 0, leads = [], carrello = [], sectionFilter = null, loggedIn = false;
  const users = JSON.parse(localStorage.getItem('users')||'[]');

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
    authModal: document.getElementById('auth-modal'),
    paymentModal: document.getElementById('payment-modal'),
    btnLogin: document.getElementById('btnLogin'),
    btnRegister: document.getElementById('btnRegister'),
    btnRecoverPassword: document.getElementById('btnRecoverPassword'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    recoverPasswordForm: document.getElementById('recover-password-form'),
    closeAuth: document.getElementById('close-auth'),
    showLogin: document.getElementById('show-login'),
    showRegister: document.getElementById('show-register'),
    showRecover: document.getElementById('show-recover'),
    payPayPal: document.getElementById('pay-paypal'),
    payCard: document.getElementById('pay-card'),
    payBank: document.getElementById('pay-bank'),
    closePay: document.getElementById('close-payment')
  };

  function updateCreditUI() {
    elems.credDisp.textContent = crediti.toFixed(2);
    elems.euroDisp.textContent = '€'+(crediti*40).toFixed(2);
  }
  function openAuth() { elems.authModal.style.display='flex'; }
  function closeAuth() { elems.authModal.style.display='none'; }
  function openPayment() { elems.paymentModal.style.display='flex'; }
  function closePayment() { elems.paymentModal.style.display='none'; }

  elems.btnRicarica.onclick = openPayment;
  elems.payPayPal.onclick = () => window.open('https://www.paypal.com/paypalme/YourBusiness','_blank');
  elems.payCard.onclick = () => window.open('https://your-stripe-checkout-link','_blank');
  elems.payBank.onclick = () => alert('Bonifico: IBAN IT00...');

  elems.showLogin.onclick = () => { elems.loginForm.style.display='block'; elems.registerForm.style.display='none'; elems.recoverPasswordForm.style.display='none'; };
  elems.showRegister.onclick = () => { elems.loginForm.style.display='none'; elems.registerForm.style.display='block'; elems.recoverPasswordForm.style.display='none'; };
  elems.showRecover.onclick = () => { elems.loginForm.style.display='none'; elems.registerForm.style.display='none'; elems.recoverPasswordForm.style.display='block'; };
  elems.closeAuth.onclick = closeAuth;
  elems.closePay.onclick = closePayment;

  elems.btnRegister.onclick = () => {
    const name = document.getElementById('register-name').value.trim();
    const surname = document.getElementById('register-surname').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const pwd = document.getElementById('register-password').value;
    const pwd2 = document.getElementById('register-password2').value;
    const captcha = document.getElementById('captcha').value.trim();
    if(!name||!surname||!phone||!email||!pwd||!pwd2) return alert('Compila tutti i campi');
    if(pwd!==pwd2) return alert('Le password non corrispondono');
    if(captcha!=='5') return alert('Captcha non corretto');
    users.push({name,surname,phone,email,pwd});
    localStorage.setItem('users',JSON.stringify(users));
    alert('Registrazione avvenuta! Effettua il login.');
    elems.showLogin.click();
  };
  elems.btnLogin.onclick = () => {
    const email = document.getElementById('login-email').value.trim();
    const pwd = document.getElementById('login-password').value;
    if(users.find(u=>u.email===email&&u.pwd===pwd)) {
      loggedIn=true; closeAuth(); updateCreditUI(); return alert('Login ok');
    }
    alert('Credenziali non valide');
  };
  elems.btnRecoverPassword.onclick = () => {
    const email = document.getElementById('recover-email').value.trim();
    if(!email) return alert('Inserisci email');
    if(users.find(u=>u.email===email)) {
      return alert('Link di recupero inviato');
    }
    alert('Email non registrata');
  };

  function populateFilters() {
    ['regione','citta','categoria','tipo'].forEach(id=>{
      const sel=elems[id];
      const vals=Array.from(new Set(leads.map(l=>l[id]))).filter(v=>v).sort();
      sel.innerHTML='<option value="">Tutti</option>'+vals.map(v=>`<option value="${v}">${v}</option>`).join('');
      sel.onchange=render;
    });
  }

  function render() {
    elems.clienti.innerHTML='';
    const f={regione:elems.regione.value,citta:elems.citta.value,categoria:elems.categoria.value,tipo:elems.tipo.value};
    leads.forEach(lead=>{
      if(sectionFilter&&!lead.tipo.toLowerCase().includes(sectionFilter)) return;
      if(f.regione&&lead.regione!==f.regione) return;
      if(f.citta&&lead.citta!==f.citta) return;
      if(f.categoria&&lead.categoria!==f.categoria) return;
      if(f.tipo&&lead.tipo!==f.tipo) return;
      let cost=0; const t=lead.tipo.toLowerCase();
      if(t.includes('lead')) cost=1; else if(t.includes('appuntamento')) cost=2;
      let cls='contratto',lbl='Contratto riservato';
      if(cost===1){cls='lead';lbl='Lead da chiamare';}
      if(cost===2){cls='appuntamento';lbl='Appuntamento fissato';}
      const card=document.createElement('div');card.className='cliente-card '+cls;
      card.innerHTML=`<div class="badge ${cls}">${lbl}</div>
<h3>${lead.categoria} – ${lead.citta}</h3>
<p>${lead.regione} | ${lead.tipo}</p>
<p class="desc">${lead.descrizione||''}</p>
<p>Budget: <strong>€${lead.budget}</strong></p>
<p class="commission">${cost>0?`Commissione: €${cost*40} (${cost} ${cost>1?'crediti':'credito'})`:'Commissione riservata'}</p>`;
      const act=document.createElement('div');act.className='actions';
      const btnA=document.createElement('button');btnA.className='acquisisci';btnA.textContent='Acquisisci';
      const btnC=document.createElement('button');btnC.className='annulla';btnC.textContent='Annulla';btnC.style.display='none';
      btnA.onclick=()=>{
        if(!loggedIn){openAuth();return;}
        if(crediti<cost){
          if(confirm('Crediti insufficienti. Acquista crediti?')) openPayment();
          return;
        }
        crediti-=cost; updateCreditUI(); carrello.push(lead); updateCart(); btnA.disabled=true; btnC.style.display='inline-block';
      };
      btnC.onclick=()=>{crediti+=cost; updateCreditUI(); carrello=carrello.filter(l=>l.id!==lead.id); updateCart(); btnA.disabled=false; btnC.style.display='none';};
      act.append(btnA,btnC);card.append(act);elems.clienti.append(card);
    });
  }

  function updateCart(){
    elems.cart.innerHTML='';let sum=0;
    carrello.forEach(item=>{
      const t=item.tipo.toLowerCase();const c=t.includes('lead')?1:t.includes('appuntamento')?2:0;
      sum+=c*40;
      const li=document.createElement('li');li.textContent=`${item.id} – €${c*40}`;
      const b=document.createElement('button');b.className='annulla';b.textContent='Annulla';b.onclick=()=>render();li.append(b);elems.cart.append(li);
    });
    elems.tot.textContent='Totale: €'+sum;
  }

  elems.btnLeads.onclick=()=>{sectionFilter='lead';elems.btnLeads.classList.toggle('selected');render();};
  elems.btnAppuntamenti.onclick=()=>{sectionFilter='appuntamento';elems.btnAppuntamenti.classList.toggle('selected');render();};
  elems.btnContratti.onclick=()=>{sectionFilter='contratto';elems.btnContratti.classList.toggle('selected');render();};

  fetch(sheetURL).then(r=>r.text()).then(txt=>{
    const lines=txt.trim().split('
');
    const headers=lines.shift().split('	').map(h=>h.trim().toLowerCase());
    const idx={regione:headers.indexOf('regione')>=0?headers.indexOf('regione'):0,citta:headers.indexOf('citta')>=0?headers.indexOf('citta'):1,
      categoria:headers.indexOf('categoria')>=0?headers.indexOf('categoria'):2,tipo:headers.indexOf('tipo')>=0?headers.indexOf('tipo'):3,
      descrizione:headers.indexOf('descrizione')>=0?headers.indexOf('descrizione'):-1,
      budget:headers.findIndex(h=>h.includes('budget'))>=0?headers.findIndex(h=>h.includes('budget')):4};
    leads=lines.map((l,i)=>{const c=l.split('	');return{id:'lead-'+i,regione:c[idx.regione]||'',citta:c[idx.citta]||'',categoria:c[idx.categoria]||'',tipo:c[idx.tipo]||'',descrizione:idx.descrizione>=0?c[idx.descrizione]:'',budget:parseInt(c[idx.budget])||0};});
    populateFilters();render();updateCreditUI();
  });
});