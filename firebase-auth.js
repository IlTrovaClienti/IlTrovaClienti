// firebase-auth.js
// (includi questo DOPO firebase-init.js nel tuo index.html)

// Prendo l’istanza precedentemente esposta
const auth = window.auth;

// Collegamento dei listener solo se il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = registerForm['register-email'].value;
      const pwd   = registerForm['register-password'].value;
      const errBx = document.getElementById('register-error');
      if (errBx) errBx.textContent = '';

      auth.createUserWithEmailAndPassword(email, pwd)
        .then(cred => cred.user.sendEmailVerification())
        .then(() => {
          registerForm.reset();
          alert('Registrazione completata! Controlla la tua email.');
          document.getElementById('close-auth')?.click();
        })
        .catch(err => { if (errBx) errBx.textContent = err.message; });
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = loginForm['login-email'].value;
      const pwd   = loginForm['login-password'].value;
      const errBx = document.getElementById('login-error');
      if (errBx) errBx.textContent = '';

      auth.signInWithEmailAndPassword(email, pwd)
        .then(() => loginForm.reset())
        .catch(err => { if (errBx) errBx.textContent = err.message; });
    });
  }

  // logout
  document.getElementById('logout-button')?.addEventListener('click', () => auth.signOut());
});

// Stato utente
auth.onAuthStateChanged(user => {
  const loginBtn    = document.getElementById('login-button');
  const registerBtn = document.getElementById('register-button');
  const logoutBtn   = document.getElementById('logout-button');

  if (user) {
    loginBtn?.style.setProperty('display','none');
    registerBtn?.style.setProperty('display','none');
    logoutBtn?.style.setProperty('display','inline-block');
  } else {
    loginBtn?.style.setProperty('display','inline-block');
    registerBtn?.style.setProperty('display','inline-block');
    logoutBtn?.style.setProperty('display','none');
  }
});
