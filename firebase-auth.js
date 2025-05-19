// firebase-auth.js
// Assicurati di includere questo *dopo* firebase-init.js

// Riferimento a Firebase Auth
const auth = firebase.auth();

// Al caricamento del DOM, collego i listener se gli elementi esistono
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = registerForm['register-email'].value;
      const password = registerForm['register-password'].value;
      const errorBox = document.getElementById('register-error');
      if (errorBox) errorBox.textContent = '';

      auth.createUserWithEmailAndPassword(email, password)
        .then(cred => cred.user.sendEmailVerification())
        .then(() => {
          registerForm.reset();
          alert('Registrazione completata! Controlla la tua email per verificare l\'account.');
          const closeBtn = document.getElementById('close-auth');
          if (closeBtn) closeBtn.click();
        })
        .catch(err => {
          if (errorBox) errorBox.textContent = err.message;
        });
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = loginForm['login-email'].value;
      const password = loginForm['login-password'].value;
      const errorBox = document.getElementById('login-error');
      if (errorBox) errorBox.textContent = '';

      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          loginForm.reset();
        })
        .catch(err => {
          if (errorBox) errorBox.textContent = err.message;
        });
    });
  }

  const logoutBtn = document.getElementById('logout-button');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => auth.signOut());
  }
});

// Listener di stato utente
auth.onAuthStateChanged(user => {
  const loginBtn     = document.getElementById('login-button');
  const registerBtn  = document.getElementById('register-button');
  const logoutBtn    = document.getElementById('logout-button');

  if (user) {
    document.body.classList.add('user-logged-in');
    if (loginBtn)    loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn)   logoutBtn.style.display = 'inline-block';
  } else {
    document.body.classList.remove('user-logged-in');
    if (loginBtn)    loginBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'inline-block';
    if (logoutBtn)   logoutBtn.style.display = 'none';
  }
});
