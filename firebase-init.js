// firebase-auth.js
// Includi questo file dopo firebase-init.js nel tuo index.html

// Riferimento a Firebase Auth
const auth = firebase.auth();

// Attendi il caricamento del DOM per collegare i listener
document.addEventListener('DOMContentLoaded', () => {
  // FUNZIONE DI REGISTRAZIONE
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = registerForm['register-email'].value;
      const password = registerForm['register-password'].value;
      const errorBox = document.getElementById('register-error');
      errorBox.textContent = '';

      auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
          // Invia email di verifica
          return cred.user.sendEmailVerification();
        })
        .then(() => {
          registerForm.reset();
          // Mostra messaggio di successo
          alert('Registrazione completata! Controlla la tua email per verificare l\'account.');
          // Qui puoi chiudere il modal se usi un plugin/modal custom
        })
        .catch(err => {
          errorBox.textContent = err.message;
        });
    });
  }

  // FUNZIONE DI LOGIN
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = loginForm['login-email'].value;
      const password = loginForm['login-password'].value;
      const errorBox = document.getElementById('login-error');
      errorBox.textContent = '';

      auth.signInWithEmailAndPassword(email, password)
        .then(() => {
          loginForm.reset();
          // Chiudi il modal di login
        })
        .catch(err => {
          errorBox.textContent = err.message;
        });
    });
  }

  // GESTIONE LOGOUT
  const logoutBtn = document.getElementById('logout-button');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut();
    });
  }
});

// LISTENER STATO UTENTE
auth.onAuthStateChanged(user => {
  const loginBtn = document.getElementById('login-button');
  const registerBtn = document.getElementById('register-button');
  const logoutBtn = document.getElementById('logout-button');

  if (user) {
    document.body.classList.add('user-logged-in');
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    document.body.classList.remove('user-logged-in');
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (registerBtn) registerBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
});
