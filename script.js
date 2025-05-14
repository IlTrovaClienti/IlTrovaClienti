document.addEventListener('DOMContentLoaded', () => {
  const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
  let leads = [];
  const elems = {
    regione: document.getElementById('regione'),
    citta: document.getElementById('citta'),
    categoria: document.getElementById('categoria'),
    tipo: document.getElementById('tipo'),
    clienti: document.getElementById('clienti'),
    cart: document.getElementById('carrello'),
    tot: document.getElementById('totale')
  };
  function populateFilters() {
    ['regione','citta','categoria','tipo'].forEach(id => {
      const sel = elems[id];
      const vals = Array.from(new Set(leads.map(l=>l[id]))).filter(v=>v).sort();
      sel.innerHTML = '<option value="">Tutti</option>' + vals.map(v=>`<option>${v}</option>`).join('');
      sel.onchange = render;
    });
  }
  function render() {
    elems.clienti.innerHTML = '';
    leads.forEach(lead => {
      const card = document.createElement('div');
      card.innerHTML = `<h3>${lead.categoria} – ${lead.citta}</h3><p>${lead.regione} | ${lead.tipo}</p><p>Budget: €${lead.budget}</p>`;
      elems.clienti.append(card);
    });
  }
  fetch(sheetURL).then(r=>r.text()).then(txt=>{
    const lines = txt.trim().split('\n');
    const headers = lines.shift().split('\t');
    leads = lines.map(l=>{
      const c = l.split('\t');
      return {
        regione: c[0], citta: c[1], categoria: c[2], tipo: c[3],
        budget: parseInt(c[4])||0
      };
    });
    populateFilters();
    render();
  });
});
