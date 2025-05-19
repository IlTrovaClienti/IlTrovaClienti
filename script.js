// script.js

// ID reale del tuo foglio Google
const sheetURL = 'https://docs.google.com/spreadsheets/d/1A9MwVJDornFA2YI860U_9CpeBUGFheLCYNea5iOBCrU/pubhtml';

let leads = [];
let sectionFilter = 'lead';

document.addEventListener('DOMContentLoaded', () => {

  // Inizializza Tabletop per caricare i lead
  Tabletop.init({
    key: sheetURL,
    callback: data => {
      leads = data.map((l, i) => ({
        id: i + 1,
        regione: l.Regione,
        citta: l.Città,
        categoria: l.Categoria,
        tipo: l.Tipo.toLowerCase(),
        descrizione: l.Descrizione,
        telefono: l.Telefono,
        budget: l.Budget || 'N/A'
      }));
      renderLeads();
    },
    simpleSheet: true
  });

  // Funzione per filtrare e renderizzare le card
  function renderLeads() {
    const filtered = leads.filter(l =>
      (sectionFilter === '' || l.tipo === sectionFilter)
    );
    const container = document.getElementById('clienti');
    container.innerHTML = '';
    filtered.forEach(l => {
      const card = document.createElement('div');
      card.className = 'cliente-card ' + l.tipo;
      card.innerHTML = `
        <span class="badge ${
        l.tipo === 'lead' ? 'Lead' : 'Appuntamento'
      }"></span>
        <h3>${l.regione} – ${l.citta}</h3>
        <p>${l.descrizione}</p>
        <p>Budget: €${l.budget}</p>`;
      container.appendChild(card);
    });
  }

  // Listener per apertura/chiusura modale Contatto
  const contactModal = document.getElementById('contact-modal');
  const openContactBtn = document.getElementById('btnContactSend');
  const closeContactBtn = document.getElementById('close-contact');
  if (openContactBtn && contactModal) {
    openContactBtn.addEventListener('click', () => {
      contactModal.classList.add('visible');
    });
  }
  if (closeContactBtn && contactModal) {
    closeContactBtn.addEventListener('click', () => {
      contactModal.classList.remove('visible');
    });
  }

  // Listener per modale Authentication
  const authModal = document.getElementById('auth-modal');
  const showLoginBtn = document.getElementById('show-login');
  const showRegisterBtn = document.getElementById('show-register');
  const closeAuthBtn = document.getElementById('close-auth');
  if (showLoginBtn && authModal) {
    showLoginBtn.addEventListener('click', () => {
      authModal.classList.add('visible');
      document.getElementById('login-section').style.display = 'block';
      document.getElementById('register-section').style.display = 'none';
    });
  }
  if (showRegisterBtn && authModal) {
    showRegisterBtn.addEventListener('click', () => {
      authModal.classList.add('visible');
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('register-section').style.display = 'block';
    });
  }
  if (closeAuthBtn && authModal) {
    closeAuthBtn.addEventListener('click', () => {
      authModal.classList.remove('visible');
    });
  }

  // Listener per chiusura modale Pagamento
  const paymentModal = document.getElementById('payment-modal');
  const closePaymentBtn = document.getElementById('close-payment');
  if (closePaymentBtn && paymentModal) {
    closePaymentBtn.addEventListener('click', () => {
      paymentModal.classList.remove('visible');
    });
  }
});
