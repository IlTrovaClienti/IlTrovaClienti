// script.js
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkDKqQuhfgBlDD1kWHOYg9amAZmDBCQCi3o-eT4HramTOY-PLelbGPCrEMcKd4I6PWu4L_BFGIhREy/pub?output=tsv';
let leads = [];
let sectionFilter = 'lead';

document.addEventListener('DOMContentLoaded', () => {
  fetch(sheetURL).then(res => res.text()).then(text => {
    const rows = text.trim().split('\n');
    const headers = rows.shift().split('\t');
    leads = rows.map(line => {
      const cols = line.split('\t');
      const obj = {};
      headers.forEach((h,i) => obj[h] = cols[i] || '');
      return { regione: obj.Regione, citta: obj.Città, categoria: obj.Categoria, tipo: obj.Tipo.toLowerCase(), descrizione: obj.Descrizione, telefono: obj.Telefono, budget: obj['Budget (€)'] || 'N/A' };
    });
    renderLeads();
  }).catch(err => console.error('Errore dati:', err));

  function renderLeads() {
    const container = document.getElementById('clienti');
    container.innerHTML = '';
    leads.filter(l => sectionFilter === '' || l.tipo === sectionFilter)
         .forEach(l => {
      const card = document.createElement('div');
      card.className = 'cliente-card ' + l.tipo;
      card.innerHTML = `
        <span class="badge">${l.tipo === 'lead'? 'Lead' : 'Appuntamento'}</span>
        <h3>${l.regione} – ${l.citta}</h3>
        <p>${l.descrizione}</p>
        <p>Budget: €${l.budget}</p>`;
      container.appendChild(card);
    });
  }

  // Modali e action handlers
  document.getElementById('btnContactSend')?.addEventListener('click', () => document.getElementById('contact-modal').classList.add('visible'));
  document.getElementById('close-contact')?.addEventListener('click', () => document.getElementById('contact-modal').classList.remove('visible'));
  document.getElementById('show-login')?.addEventListener('click', () => document.getElementById('auth-modal').classList.add('visible'));
  document.getElementById('show-register')?.addEventListener('click', () => document.getElementById('auth-modal').classList.add('visible'));
  document.getElementById('close-auth')?.addEventListener('click', () => document.getElementById('auth-modal').classList.remove('visible'));
  document.getElementById('close-payment')?.addEventListener('click', () => document.getElementById('payment-modal').classList.remove('visible'));
  document.getElementById('ricarica')?.addEventListener('click', () => window.location.href = 'ricarica.html');
});
