
document.addEventListener('DOMContentLoaded', () => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
  let crediti = 8, leads = [], carrello = [], sectionFilter = null, loggedIn = false;

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
    payModal: document.getElementById('payment-modal'),
    btnPayPal: document.getElementById('pay-paypal'),
    btnCard: document.getElementById('pay-card'),
    btnBank: document.getElementById('pay-bank'),
    btnClosePay: document.getElementById('close-payment'),
    btnLogin: document.getElementById('login-btn'),
    btnRegister: document.getElementById('register-btn'),
    btnRecoverPassword: document.getElementById('recover-password-btn'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    recoverPasswordForm: document.getElementById('recover-password-form')
  };

  function checkLoginStatus() {
    if (!loggedIn) {
      elems.payModal.style.display = 'flex'; // Show the login/register modal when attempting to buy credits or leads
    }
  }

  function updateCreditUI() {
    elems.credDisp.textContent = crediti.toFixed(2);
    elems.euroDisp.textContent = '€' + (crediti * 40).toFixed(2);
  }

  function populateFilters() {
    ['regione','citta','categoria','tipo'].forEach(id => {
      const sel = elems[id];
      const values = Array.from(new Set(leads.map(l => l[id]))).filter(v=>v).sort();
      sel.innerHTML = '<option value="">Tutti</option>' + values.map(v=>`<option value="${v}">${v}</option>`).join('');
      sel.onchange = render;
    });
  }

  function render() {
    elems.clienti.innerHTML = '';
    const filters = {
      regione: elems.regione.value,
      citta: elems.citta.value,
      categoria: elems.categoria.value,
      tipo: elems.tipo.value
    };
    leads.forEach(lead => {
      if (sectionFilter && !lead.tipo.toLowerCase().includes(sectionFilter)) return;
      if (filters.regione && lead.regione !== filters.regione) return;
      if (filters.citta && lead.citta !== filters.citta) return;
      if (filters.categoria && lead.categoria !== filters.categoria) return;
      if (filters.tipo && lead.tipo !== filters.tipo) return;

      let costCredit = 0;
      const t = lead.tipo.toLowerCase();
      if (t.includes('lead')) costCredit = 1;
      else if (t.includes('appuntamento')) costCredit = 2;
      else costCredit = 0;

      let typeClass = 'contratto', typeLabel = 'Contratto riservato';
      if (costCredit === 1) { typeClass = 'lead'; typeLabel = 'Lead da chiamare'; }
      else if (costCredit === 2) { typeClass = 'appuntamento'; typeLabel = 'Appuntamento fissato'; }

      const card = document.createElement('div');
      card.className = 'cliente-card ' + typeClass;
      card.innerHTML = `
        <div class="badge ${typeClass}">${typeLabel}</div>
        <h3>${lead.categoria} – ${lead.citta}</h3>
        <p>${lead.regione} | ${lead.tipo}</p>
        <p class="desc">${lead.descrizione || ''}</p>
        <p>Budget: €${lead.budget}</p>
        <p class="commission">${costCredit>0?`Commissione: €${costCredit*40} (${costCredit} ${costCredit>1?'crediti':'credito'})`:'Commissione riservata'}</p>
      `;

      const act = document.createElement('div'); act.className = 'actions';
      if (costCredit > 0) {
        const btnA = document.createElement('button'); btnA.className='acquisisci'; btnA.textContent='Acquisisci';
        const btnC = document.createElement('button'); btnC.className='annulla'; btnC.textContent='Annulla'; btnC.style.display='none';
        btnA.onclick = () => {
          checkLoginStatus();
          if (loggedIn) {
            crediti -= costCredit; updateCreditUI();
            carrello.push(lead); updateCart();
            btnA.disabled = true; btnC.style.display = 'inline-block';
          }
        };
        btnC.onclick = () => {
          crediti += costCredit; updateCreditUI();
          carrello = carrello.filter(l => l.id !== lead.id); updateCart();
          btnA.disabled = false; btnC.style.display = 'none';
        };
        act.append(btnA, btnC);
      } else {
        const btnR = document.createElement('button'); btnR.className='contratto'; btnR.textContent='Riserva trattativa';
        btnR.onclick = () => { elems.payModal.style.display = 'flex'; };
        act.append(btnR);
      }
      card.append(act);
      elems.clienti.append(card);
    });
  }

  function updateCart() {
    elems.cart.innerHTML = ''; let sum = 0;
    carrello.forEach(item => {
      const t = item.tipo.toLowerCase();
      let costCredit = t.includes('lead') ? 1 : t.includes('appuntamento') ? 2 : 0;
      sum += costCredit * 40;
      const li = document.createElement('li');
      li.textContent = `${item.id} – €${costCredit*40}`;
      const btn = document.createElement('button'); btn.className='annulla'; btn.textContent='Annulla';
      btn.onclick = () => render();
      li.append(btn);
      elems.cart.append(li);
    });
    elems.tot.textContent = 'Totale: €' + sum;
  }

  // registration and login popups and functionality
  elems.btnRicarica.onclick = () => { elems.payModal.style.display = 'flex'; };
  elems.btnClosePay.onclick = () => { elems.payModal.style.display = 'none'; };
  elems.btnLogin.onclick = () => { 
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (email && password) {
      loggedIn = true;
      alert('Login successful!');
      elems.payModal.style.display = 'none';
    } else {
      alert('Please enter valid credentials.');
    }
  };

  elems.btnRegister.onclick = () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    if (email && password) {
      alert('Registration successful! You can now log in.');
      elems.registerForm.style.display = 'none'; 
      elems.loginForm.style.display = 'block'; 
    } else {
      alert('Please fill all fields.');
    }
  };

  elems.btnRecoverPassword.onclick = () => {
    const email = document.getElementById('recover-email').value;
    if (email) {
      alert('Password recovery link has been sent to ' + email);
    } else {
      alert('Please enter your email address.');
    }
  };

  // section toggles
  elems.btnLeads.onclick = () => { sectionFilter = sectionFilter==='lead'?null:'lead'; elems.btnLeads.classList.toggle('selected'); render(); };
  elems.btnAppuntamenti.onclick = () => { sectionFilter = sectionFilter==='appuntamento'?null:'appuntamento'; elems.btnAppuntamenti.classList.toggle('selected'); render(); };
  elems.btnContratti.onclick = () => { sectionFilter = sectionFilter==='contratto'?null:'contratto'; elems.btnContratti.classList.toggle('selected'); render(); };

  // fetch data
  fetch(sheetURL).then(r => r.text()).then(txt => {
    const lines = txt.trim().split('\n');
    const headers = lines.shift().split('\t').map(h => h.trim().toLowerCase());
    const idx = {
      regione: headers.indexOf('regione')>=0?headers.indexOf('regione'):0,
      citta: headers.indexOf('città')>=0?headers.indexOf('città'):headers.indexOf('citta')>=0?headers.indexOf('citta'):1,
      categoria: headers.indexOf('categoria')>=0?headers.indexOf('categoria'):2,
      tipo: headers.indexOf('tipo')>=0?headers.indexOf('tipo'):3,
      descrizione: headers.indexOf('descrizione')>=0?headers.indexOf('descrizione'):-1,
      budget: headers.findIndex(h => h.includes('budget'))>=0?headers.findIndex(h => h.includes('budget')):4
    };
    leads = lines.map((l, i) => {
      const c = l.split('\t');
      return {
        id: 'lead-'+i,
        regione: c[idx.regione]||'',
        citta: c[idx.citta]||'',
        categoria: c[idx.categoria]||'',
        tipo: c[idx.tipo]||'',
        descrizione: idx.descrizione>=0?c[idx.descrizione]:'',
        budget: parseInt(c[idx.budget])||0
      };
    });
    populateFilters();
    render();
    updateCreditUI();
  });
});
