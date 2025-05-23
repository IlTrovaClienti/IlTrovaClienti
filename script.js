// === CONFIG ===
// Google Sheet TSV pubblicato
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?gid=71180301&single=true&output=tsv';

const elems = {
  regione:      document.getElementById('regione'),
  citta:        document.getElementById('citta'),
  btnLeads:     document.getElementById('btnLeads'),
  btnAppuntamenti: document.getElementById('btnAppuntamenti'),
  btnContratti:    document.getElementById('btnContratti'),
  btnReset:    document.getElementById('btnReset'),
  clienti:      document.getElementById('clienti'),
  authModal:    document.getElementById('auth-modal'),
  showLogin:    document.getElementById('show-login'),
  showRegister: document.getElementById('show-register'),
  loginForm:    document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  btnLogin:     document.getElementById('btnLogin'),
  btnRegister:  document.getElementById('btnRegister'),
  closeAuth:    document.getElementById('close-auth'),
  contactModal: document.getElementById('contact-modal'),
  closeContact: document.getElementById('close-contact'),
  btnContact:   document.getElementById('btnContactSend'),
  creditiDisp:  document.getElementById('crediti'),
  euroDisp:     document.getElementById('euro')
};

let leads = [], sectionFilter = 'lead', filters = { regione: '', citta: '' };

// === UTILS ===
function normalize(str) { return (str||'').toLowerCase().trim().replace(/[àá]/gi, 'a').replace(/[èé]/gi, 'e').replace(/[ìí]/gi, 'i').replace(/[òó]/gi, 'o').replace(/[ùú]/gi, 'u'); }
function onlyUnique(arr) { return [...new Set(arr.filter(x=>x&&x.length>0))]; }

// === RESET ===
function resetFiltersAndTab() {
  filters = { regione:'', citta:'' };
  sectionFilter = 'lead';
  elems.btnLeads.classList.add('selected');
  elems.btnAppuntamenti.classList.remove('selected');
  elems.btnContratti.classList.remove('selected');
  render();
}

// === RENDER FILTERS ===
function renderFilters() {
  // Regione
  const regioni = onlyUnique(leads.map(x=>x.regione));
  elems.regione.innerHTML = `<option value="">Tutte le regioni</option>` + regioni.map(r=>
    `<option value="${r}">${r}</option>`
  ).join('');
  elems.regione.value = filters.regione;

  // Citta
  const citta = onlyUnique(leads.filter(l=>!filters.regione||l.regione===filters.regione).map(x=>x.citta));
  elems.citta.innerHTML = `<option value="">Tutte le citta</option>` + citta.map(c=>
    `<option value="${c}">${c}</option>`
  ).join('');
  elems.citta.value = filters.citta;
}

// === ICON MAPPING ===
function getIconByCategoria(cat) {
  // Normalizza categoria e trova icona
  cat = normalize(cat);
  if(cat.includes('fotovoltaico') || cat.includes('solare')) return 'solar-panel.png';
  if(cat.includes('bagno')) return 'toilet.png';
  if(cat.includes('cucina')) return 'kitchen.png';
  if(cat.includes('elettric') || cat.includes('impianto elettrico')) return 'bolt.png';
  if(cat.includes('idraulic') || cat.includes('acqua')) return 'water-tap.png';
  if(cat.includes('pittura') || cat.includes('tinteggia')) return 'paint-roller.png';
  if(cat.includes('cartongesso')) return 'drywall.png';
  if(cat.includes('infissi') || cat.includes('finestr')) return 'window.png';
  if(cat.includes('piastrell') || cat.includes('pavimento')) return 'tile.png';
  if(cat.includes('cappotto') || cat.includes('isolamento')) return 'insulation.png';
  if(cat.includes('portone') || cat.includes('cancello')) return 'gate.png';
  if(cat.includes('manutenzione') || cat.includes('riparazione')) return 'wrench.png';
  if(cat.includes('tetto')) return 'roof.png';
  // Default
  return 'worker.png';
}

// === RENDER CARDS ===
function render() {
  // Filtra leads in base a tab e filtri
  let filtered = leads.filter(l =>
    (sectionFilter === 'lead' ? l.tipo === 'lead'
    : sectionFilter === 'appuntamento' ? l.tipo === 'appuntamento'
    : l.tipo === 'contratto')
    && (!filters.regione || l.regione === filters.regione)
    && (!filters.citta || l.citta === filters.citta)
  );
  elems.clienti.innerHTML = filtered.map(l=>{
    let badgeClass = l.tipo === 'lead' ? 'badge-lead' : l.tipo === 'appuntamento' ? 'badge-appuntamento' : 'badge-contratto';
    let badgeLabel = l.tipo === 'lead' ? 'Lead da chiamare' : l.tipo === 'appuntamento' ? 'Appuntamento fissato' : 'Contratto riservato';
    let icona = getIconByCategoria(l.categoria);
    let crediti = l.tipo === 'lead' ? 1 : l.tipo === 'appuntamento' ? 2 : 0;
    let budget = Number(l.budget)||0;
    let btnLabel = l.tipo === 'contratto' ? 'Acquisisci contratto'
      : `Acquisisci con ${crediti} credito${crediti>1?'i':''}`;
    return `
      <div class="cliente-card">
        <div class="card-row">
          <div class="card-icon"><img src="assets/${icona}" alt="" width="36" height="36"></div>
          <div>
            <span class="${badgeClass}">${badgeLabel}</span>
          </div>
        </div>
        <div class="card-description">${l.descrizione}</div>
        <div class="card-budget"><b>${crediti > 0 ? crediti + ' credito' + (crediti>1?'i':'') : 'Riservato'} – €${budget.toLocaleString('it-IT')}</b></div>
        ${crediti>0 ? `<div class="card-commission">Budget totale: <b>€${budget.toLocaleString('it-IT')}</b></div>` : ''}
        <div class="card-phone-locked"><span class="icon-lock">🔒</span>Disponibile solo dopo acquisizione</div>
        <div class="card-actions">
          <button class="${l.tipo==='contratto'?'acquisisci-contratto':'acquisisci'}" data-id="${l.id}">${btnLabel}</button>
        </div>
      </div>
    `;
  }).join('');
  // Crediti fittizi demo
  elems.creditiDisp.textContent = "0";
  elems.euroDisp.textContent = "€0";
  // Filtri e tab
  renderFilters();
}

// === EVENTI ===
elems.btnLeads.onclick = ()=>{
  sectionFilter='lead';
  elems.btnLeads.classList.add('selected');
  elems.btnAppuntamenti.classList.remove('selected');
  elems.btnContratti.classList.remove('selected');
  render();
};
elems.btnAppuntamenti.onclick = ()=>{
  sectionFilter='appuntamento';
  elems.btnLeads.classList.remove('selected');
  elems.btnAppuntamenti.classList.add('selected');
  elems.btnContratti.classList.remove('selected');
  render();
};
elems.btnContratti.onclick = ()=>{
  sectionFilter='contratto';
  elems.btnLeads.classList.remove('selected');
  elems.btnAppuntamenti.classList.remove('selected');
  elems.btnContratti.classList.add('selected');
  render();
};
elems.btnReset.onclick = resetFiltersAndTab;
elems.regione.onchange = e=>{
  filters.regione = e.target.value;
  filters.citta = ''; // reset città
  render();
};
elems.citta.onchange = e=>{
  filters.citta = e.target.value;
  render();
};

// === FETCH LEADS ===
fetch(sheetURL).then(r=>r.text()).then(txt=>{
  const lines = txt.trim().split('\n');
  const headers = lines.shift().split('\t').map(h=>normalize(h));
  leads = lines.map((l,i)=>{
    const cols = l.split('\t');
    return {
      id: i+1,
      regione: cols[headers.indexOf('regione')],
      citta:   cols[headers.indexOf('citta')],
      categoria: cols[headers.indexOf('categoria')],
      tipo:    cols[headers.indexOf('tipo')],   // 'lead' | 'appuntamento' | 'contratto'
      descrizione: cols[headers.indexOf('descrizione')],
      telefono: cols[headers.indexOf('telefono')],
      budget:  parseFloat(cols[headers.indexOf('budget (€)')])
    };
  });
  render();
});

// === MODALI E LOGIN (resta uguale, login/registrazione, popup contatto, ecc) ===
document.body.addEventListener('click', function(e) {
  if(e.target.classList.contains('acquisisci') || e.target.classList.contains('acquisisci-contratto')) {
    if (!auth.currentUser) {
      elems.authModal.style.display = 'flex';
      return;
    }
    alert('Demo: Acquisizione non attiva!');
  }
});
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
elems.btnLogin.onclick = (e)=>{
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pwd   = document.getElementById('login-password').value;
  const cap   = document.getElementById('login-captcha').value;
  if(cap.trim()!=='5') return alert('Captcha errato');
  auth.signInWithEmailAndPassword(email,pwd)
    .then(()=>{ elems.authModal.style.display='none'; })
    .catch(err=>alert(err.message));
};
elems.btnRegister.onclick = (e)=>{
  e.preventDefault();
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
elems.closeContact.onclick   = ()=> elems.contactModal.style.display='none';
elems.btnContact.onclick     = ()=> { alert('Richiesta inviata'); elems.contactModal.style.display='none'; };

// Fine file
