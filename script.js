// URL del foglio TSV pubblicato
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';

// Elementi DOM
const elems = {
  regione: document.getElementById('regione'),
  citta: document.getElementById('citta'),
  categoria: document.getElementById('categoria'),
  btnLeads: document.getElementById('btnLeads'),
  btnAppuntamenti: document.getElementById('btnAppuntamenti'),
  btnContratti: document.getElementById('btnContratti'),
  clienti: document.getElementById('clienti'),
  carrello: document.getElementById('carrello'),
  totale: document.getElementById('totale'),
  crediti: document.getElementById('crediti'),
  euro: document.getElementById('euro'),
  btnCheckout: document.getElementById('btnCheckout'),
  btnRicarica: document.getElementById('btnRicarica'),
};

// Stato
let leads = [];
let filters = { regione:'', citta:'', categoria:'' };
let sectionFilter = 'lead'; // 'lead','appuntamento','contratto'

// Carica e parsifica TSV
fetch(sheetURL)
  .then(res => {
    if (!res.ok) throw new Error('Sheet non trovato: '+res.status);
    return res.text();
  })
  .then(tsv => {
    const lines = tsv.trim().split('\n');
    const headers = lines.shift().split('\t').map(h=>h.toLowerCase().normalize('NFD').replace(/[^\w]/g,''));
    leads = lines.map(line=>{
      const cols = line.split('\t');
      const obj = {};
      headers.forEach((k,i)=>obj[k]=cols[i]);
      return obj;
    });
    setup();
  })
  .catch(err=>{
    console.error(err);
    elems.clienti.innerHTML = `<div style="color:red">Errore dati: ${err.message}</div>`;
  });

// Icone categoria
function getIconName(cat){
  cat=(cat||'').toLowerCase();
  if(cat.includes('fotovoltaico')||cat.includes('solare'))return'fotovoltaico.png';
  if(cat.includes('bagno'))return'bagno.png';
  if(cat.includes('cucina'))return'cucina.png';
  if(cat.includes('elettric')||cat.includes('impianto'))return'impianto-elettrico.png';
  if(cat.includes('idraulic')||cat.includes('acqua'))return'depurazione-acqua.png';
  if(cat.includes('tinteggi')||cat.includes('pittura'))return'tinteggiatura.png';
  if(cat.includes('cartongesso'))return'parete-cartongesso.png';
  if(cat.includes('infissi')||cat.includes('finestr'))return'infissi-porte.png';
  if(cat.includes('piastrell')||cat.includes('pavimento'))return'pavimentazione.png';
  if(cat.includes('cappotto')||cat.includes('isolamento'))return'facciata-cappotto.png';
  if(cat.includes('tetto'))return'tetto.png';
  if(cat.includes('pratiche'))return'pratiche-edilizie.png';
  if(cat.includes('giardinaggio'))return'giardinaggio.png';
  return'ristrutturazione.png';
}
// Icone tipo
function getTypeIcon(tipo){
  tipo=(tipo||'').toLowerCase();
  if(tipo.includes('lead'))return'lead-icon.png';
  if(tipo.includes('appuntamento'))return'appointment-icon.png';
  if(tipo.includes('contratto'))return'contract-icon.png';
  return'lead-icon.png';
}

// Setup filtri e bottoni
function setup(){
  elems.btnLeads.onclick=()=>{sectionFilter='lead';render();};
  elems.btnAppuntamenti.onclick=()=>{sectionFilter='appuntamento';render();};
  elems.btnContratti.onclick=()=>{sectionFilter='contratto';render();};
  populateFilter(elems.regione,'regione');
  populateFilter(elems.citta,'citta');
  populateFilter(elems.categoria,'categoria');
  elems.regione.onchange=()=>{filters.regione=elems.regione.value;render();};
  elems.citta.onchange=()=>{filters.citta=elems.citta.value;render();};
  elems.categoria.onchange=()=>{filters.categoria=elems.categoria.value;render();};
  render();
}
function populateFilter(sel,field){
  const vals=Array.from(new Set(leads.map(l=>l[field]||'').filter(v=>v.trim()!==''))).sort();
  sel.innerHTML=`<option value="">Tutti</option>`+vals.map(v=>`<option value="${v}">${v}</option>`).join('');
}

// Filtra leads
function filterLeads(){
  return leads.filter(l=>
    (!filters.regione||l.regione===filters.regione)&&
    (!filters.citta||l.citta===filters.citta)&&
    (!filters.categoria||l.categoria===filters.categoria)&&
    (l.tipo||'').toLowerCase().includes(sectionFilter)
  );
}

// Render cards
function render(){
  const list=filterLeads();
  elems.clienti.innerHTML='';
  list.forEach(l=>{
    const iconCat=getIconName(l.categoria),
          iconType=getTypeIcon(l.tipo);
    const card=document.createElement('div');
    card.className='cliente-card';
    card.innerHTML=`
      <img class="card-icon" src="assets/${iconCat}" alt="${l.categoria}" />
      <img class="card-icon tipo" src="assets/${iconType}" alt="${l.tipo}" />
      <h4>${l.categoria}</h4>
      <p>${l.descrizione}</p>
      <p>Budget: €${l.budget}</p>
      <div class="actions">
        <button class="${l.tipo.toLowerCase().includes('contratto')?'riserva':'acquisisci'}">
          ${l.tipo.toLowerCase().includes('contratto')?'Riserva':'Acquisisci'}
        </button>
      </div>`;
    elems.clienti.appendChild(card);
  });
}
