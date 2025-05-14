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
    btnClosePay: document.getElementById('close-payment'),
    btnLogin: document.getElementById('login-btn'),
    btnRegister: document.getElementById('register-btn'),
    btnRecoverPassword: document.getElementById('recover-password-btn'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    recoverPasswordForm: document.getElementById('recover-password-form')
  };

  document.getElementById('show-login').onclick = () => {
    elems.loginForm.style.display='block';
    elems.registerForm.style.display='none';
    elems.recoverPasswordForm.style.display='none';
  };
  document.getElementById('show-register').onclick = () => {
    elems.loginForm.style.display='none';
    elems.registerForm.style.display='block';
    elems.recoverPasswordForm.style.display='none';
  };
  document.getElementById('show-recover').onclick = () => {
    elems.loginForm.style.display='none';
    elems.registerForm.style.display='none';
    elems.recoverPasswordForm.style.display='block';
  };

  function checkLoginStatus() {
    if (!loggedIn) elems.payModal.style.display='flex';
  }

  function updateCreditUI() {
    elems.credDisp.textContent = crediti.toFixed(2);
    elems.euroDisp.textContent = '€'+(crediti*40).toFixed(2);
  }

  function populateFilters() {
    ['regione','citta','categoria','tipo'].forEach(id => {
      const sel = elems[id];
      const vals = Array.from(new Set(leads.map(l=>l[id]))).filter(v=>v).sort();
      sel.innerHTML = '<option value="">Tutti</option>' + vals.map(v=>`<option value="${v}">${v}</option>`).join('');
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
    leads.forEach(lead => {
      if (sectionFilter && !lead.tipo.toLowerCase().includes(sectionFilter)) return;
      if (f.regione && lead.regione !== f.regione) return;
      if (f.citta && lead.citta !== f.citta) return;
      if (f.categoria && lead.categoria !== f.categoria) return;
      if (f.tipo && lead.tipo !== f.tipo) return;
      let cost=0; const t=lead.tipo.toLowerCase();
      if(t.includes('lead')) cost=1; else if(t.includes('appuntamento')) cost=2;
      let cls='contratto', lbl='Contratto riservato';
      if(cost===1){cls='lead'; lbl='Lead da chiamare';}
      if(cost===2){cls='appuntamento'; lbl='Appuntamento fissato';}
      const card = document.createElement('div'); card.className='cliente-card '+cls;
      card.innerHTML = `<div class="badge ${cls}">${lbl}</div>
        <h3>${lead.categoria} – ${lead.citta}</h3>
        <p>${lead.regione} | ${lead.tipo}</p>
        <p class="desc">${lead.descrizione||''}</p>
        <p>Budget: €${lead.budget}</p>
        <p class="commission">${cost>0?`Commissione: €${cost*40} (${cost} ${cost>1?'crediti':'credito'})`:'Commissione riservata'}</p>`;
      const act = document.createElement('div'); act.className='actions';
      if(cost>0){
        const bA=document.createElement('button');bA.className='acquisisci';bA.textContent='Acquisisci';
        const bC=document.createElement('button');bC.className='annulla';bC.textContent='Annulla';bC.style.display='none';
        bA.onclick=()=>{
          checkLoginStatus();
          if(loggedIn){crediti-=cost; updateCreditUI(); carrello.push(lead); updateCart(); bA.disabled=true; bC.style.display='inline-block';}
        };
        bC.onclick=()=>{crediti+=cost; updateCreditUI(); carrello=carrello.filter(l=>l.id!==lead.id); updateCart(); bA.disabled=false; bC.style.display='none';};
        act.append(bA,bC);
      } else {
        const bR=document.createElement('button');bR.className='contratto';bR.textContent='Riserva trattativa';
        bR.onclick=()=>elems.payModal.style.display='flex'; act.append(bR);
      }
      card.append(act); elems.clienti.append(card);
    });
  }

  function updateCart(){
    elems.cart.innerHTML=''; let sum=0;
    carrello.forEach(item=>{
      const t=item.tipo.toLowerCase(); let c=t.includes('lead')?1:t.includes('appuntamento')?2:0;
      sum+=c*40;
      const li=document.createElement('li'); li.textContent=`${item.id} – €${c*40}`;
      const btn=document.createElement('button');btn.className='annulla';btn.textContent='Annulla';btn.onclick=()=>render(); li.append(btn); elems.cart.append(li);
    });
    elems.tot.textContent='Totale: €'+sum;
  }

  elems.btnRicarica.onclick=()=>elems.payModal.style.display='flex';
  elems.btnClosePay.onclick=()=>elems.payModal.style.display='none';
  elems.btnLogin.onclick=()=>{
    const e=document.getElementById('login-email').value; const p=document.getElementById('login-password').value;
    if(e&&p){loggedIn=true; alert('Login effettuato!'); elems.payModal.style.display='none';}
    else alert('Credenziali non valide');
  };
  elems.btnRegister.onclick=()=>{
    const e=document.getElementById('register-email').value; const p=document.getElementById('register-password').value;
    if(e&&p){alert('Registrazione avvenuta!'); elems.registerForm.style.display='none'; elems.loginForm.style.display='block';}
    else alert('Compila tutti i campi');
  };
  elems.btnRecoverPassword.onclick=()=>{
    const e=document.getElementById('recover-email').value;
    if(e) alert('Link inviato a '+e); else alert('Inserisci email');
  };

  elems.btnLeads.onclick=()=>{ sectionFilter='lead'; elems.btnLeads.classList.toggle('selected'); render(); };
  elems.btnAppuntamenti.onclick=()=>{ sectionFilter='appuntamento'; elems.btnAppuntamenti.classList.toggle('selected'); render(); };
  elems.btnContratti.onclick=()=>{ sectionFilter='contratto'; elems.btnContratti.classList.toggle('selected'); render(); };

  fetch(sheetURL).then(r=>r.text()).then(txt=>{
    const lines=txt.trim().split('\n');
    const headers=lines.shift().split('\t').map(h=>h.trim().toLowerCase());
    const idx={
      regione:headers.indexOf('regione')>=0?headers.indexOf('regione'):0,
      citta:headers.indexOf('citta')>=0?headers.indexOf('citta'):1,
      categoria:headers.indexOf('categoria')>=0?headers.indexOf('categoria'):2,
      tipo:headers.indexOf('tipo')>=0?headers.indexOf('tipo'):3,
      descrizione:headers.indexOf('descrizione')>=0?headers.indexOf('descrizione'):-1,
      budget:headers.findIndex(h=>h.includes('budget'))>=0?headers.findIndex(h=>h.includes('budget')):4
    };
    leads=lines.map((l,i)=>{
      const c=l.split('\t');
      return { id:'lead-'+i, regione:c[idx.regione]||'', citta:c[idx.citta]||'', categoria:c[idx.categoria]||'', tipo:c[idx.tipo]||'', descrizione:idx.descrizione>=0?c[idx.descrizione]:'', budget:parseInt(c[idx.budget])||0 };
    });
    populateFilters(); render(); updateCreditUI();
  });
});
