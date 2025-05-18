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
    elems.euroDisp.textContent = '€' + (crediti * 40).toFixed(2);
  }
  function openAuth() { elems.authModal.style.display = 'flex'; }
  function closeAuth() { elems.authModal.style.display = 'none'; }
  function openPayment() { elems.paymentModal.style.display = 'flex'; }
  function closePayment() { elems.paymentModal.style.display = 'none'; }

  elems.btnRicarica.onclick = openPayment;
  elems.checkoutSmall.onclick = () => {
    if (carrello.length === 0) {
      alert('Il carrello è vuoto');
      return;
    }
    openPayment();
  };

  // Auth modal tabs
  elems.showLogin.onclick = () => {
    elems.loginForm.classList.add('active');
    elems.registerForm.classList.remove('active');
    elems.recoverPasswordForm.classList.remove('active');
    elems.showLogin.classList.add('active');
    elems.showRegister.classList.remove('active');
    elems.showRecover.classList.remove('active');
  };
  elems.showRegister.onclick = () => {
    elems.loginForm.classList.remove('active');
    elems.registerForm.classList.add('active');
    elems.recoverPasswordForm.classList.remove('active');
    elems.showLogin.classList.remove('active');
    elems.showRegister.classList.add('active');
    elems.showRecover.classList.remove('active');
  };
  elems.showRecover.onclick = () => {
    elems.loginForm.classList.remove('active');
    elems.registerForm.classList.remove('active');
    elems.recoverPasswordForm.classList.add('active');
    elems.showLogin.classList.remove('active');
    elems.showRegister.classList.remove('active');
    elems.showRecover.classList.add('active');
  };

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
    if (!name || !surname || !phone || !email || !pwd || !pwd2) {
      alert('Compila tutti i campi');
      return;
    }
    if (pwd !== pwd2) {
      alert('Le password non corrispondono');
      return;
    }
    if (captcha !== '5') {
      alert('Captcha non corretto');
      return;
    }
    users.push({ name, surname, phone, email, pwd });
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registrazione avvenuta! Effettua il login.');
    elems.showLogin.click();
  };
  elems.btnLogin.onclick = () => {
    const email = document.getElementById('login-email').value.trim();
    const pwd = document.getElementById('login-password').value;
    if (users.find(u => u.email === email && u.pwd === pwd)) {
      loggedIn = true;
      closeAuth();
      updateCreditUI();
      alert('Login ok');
    } else {
      alert('Credenziali non valide');
    }
  };
  elems.btnRecoverPassword.onclick = () => {
    const email = document.getElementById('recover-email').value.trim();
    if (!email) {
      alert('Inserisci email');
      return;
    }
    if (users.find(u => u.email === email)) {
      alert('Link di recupero inviato');
    } else {
      alert('Email non registrata');
    }
  };

  // Section buttons
  elems.btnLeads.onclick = () => { sectionFilter = 'lead'; toggleButton(elems.btnLeads); render(); };
  elems.btnAppuntamenti.onclick = () => { sectionFilter = 'appuntamento'; toggleButton(elems.btnAppuntamenti); render(); };
  elems.btnContratti.onclick = () => { sectionFilter = 'contratto'; toggleButton(elems.btnContratti); render(); };

  function toggleButton(btn) {
    elems.btnLeads.classList.remove('selected');
    elems.btnAppuntamenti.classList.remove('selected');
    elems.btnContratti.classList.remove('selected');
    btn.classList.add('selected');
  }

  fetch(sheetURL)
    .then(r => r.text())
    .then(txt => {
      const lines = txt.trim().split('\n');
      const headers = lines.shift().split('\t').map(h => h.trim());
      leads = lines.map((line, idx) => {
        const cols = line.split('\t');
        return {
          id: idx + 1,
          regione: cols[0] || '',
          citta: cols[1] || '',
          categoria: cols[2] || '',
          tipo: cols[3] || '',
          descrizione: cols[4] || '',
          budget: parseFloat(cols[6]) || 0
        };
      });
      populateFilters();
      render();
      updateCreditUI();
    })
    .catch(err => console.error('Load error', err));

  function populateFilters() {
    ['regione', 'citta', 'categoria', 'tipo'].forEach(id => {
      const sel = document.getElementById(id);
      const opts = Array.from(new Set(leads.map(l => l[id]))).filter(v => v).sort();
      sel.innerHTML = '<option value="">Tutti</option>' + opts.map(v => `<option value="${v}">${v}</option>`).join('');
      sel.onchange = render;
    });
  }

  function render() {
    elems.clienti.innerHTML = '';
    const f = {
      regione: elems.regione.value,
      citta: elems.citta.value,
      categoria: elems.categoria.value,
      tipo: elems.tipo.value
    };
    let sum = 0;
    leads.forEach(lead => {
      if (sectionFilter && !lead.tipo.toLowerCase().includes(sectionFilter)) return;
      if (f.regione && lead.regione !== f.regione) return;
      if (f.citta && lead.citta !== f.citta) return;
      if (f.categoria && lead.categoria !== f.categoria) return;
      if (f.tipo && lead.tipo !== f.tipo) return;
      const cost = lead.tipo.toLowerCase().includes('lead') ? 1 :
                   lead.tipo.toLowerCase().includes('appuntamento') ? 2 : 0;
      const cls = cost === 1 ? 'lead' : cost === 2 ? 'appuntamento' : 'contratto';
      const label = cost === 1 ? 'Lead da chiamare' :
                    cost === 2 ? 'Appuntamento fissato' : 'Contratto riservato';
      sum += cost * 40;
      const card = document.createElement('div');
      card.className = 'cliente-card ' + cls;
      card.innerHTML = `
        <div class="badge ${cls}">${label}</div>
        <h3>${lead.categoria} – ${lead.citta}</h3>
        <p>${lead.regione} | ${lead.tipo}</p>
        <p class="desc">${lead.descrizione}</p>
        <p>Budget: <strong>€${lead.budget}</strong></p>
        <p class="commission">${cost>0?`Commissione: €${cost*40} (${cost} ${cost>1?'crediti':'credito'})`:'Commissione riservata'}</p>
      `;
      const actions = document.createElement('div');
      actions.className = 'actions';
      const btnA = document.createElement('button');
      btnA.className = 'acquisisci';
      btnA.textContent = 'Acquisisci';
      const btnC = document.createElement('button');
      btnC.className = 'annulla';
      btnC.textContent = 'Annulla';
      btnC.style.display = 'none';
      btnA.onclick = () => {
        if (!loggedIn) { openAuth(); return; }
        if (crediti < cost) { if (confirm('Crediti insufficienti. Ricarica?')) openPayment(); return; }
        crediti -= cost; updateCreditUI(); carrello.push(lead); updateCart(); btnA.disabled = true; btnC.style.display = 'inline-block';
      };
      btnC.onclick = () => {
        crediti += cost; updateCreditUI(); carrello = carrello.filter(l => l !== lead); updateCart(); btnA.disabled = false; btnC.style.display = 'none';
      };
      actions.append(btnA, btnC);
      card.append(actions);
      elems.clienti.append(card);
    });
    elems.cart.innerHTML = '';
    carrello.forEach(item => {
      const cost = item.tipo.toLowerCase().includes('lead') ? 1 :
                   item.tipo.toLowerCase().includes('appuntamento') ? 2 : 0;
      const li = document.createElement('li');
      li.textContent = `${item.categoria} – €${cost*40}`;
      const btn = document.createElement('button');
      btn.className = 'annulla';
      btn.textContent = '×';
      btn.onclick = () => { carrello = carrello.filter(i => i !== item); render(); };
      li.append(' ', btn);
      elems.cart.append(li);
    });
    elems.tot.textContent = 'Totale: €' + sum;
  }
});
