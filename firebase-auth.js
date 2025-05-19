const auth = window.auth;

document.addEventListener('DOMContentLoaded', () => {
  // Apri/chiudi modal autenticazione
  document.getElementById('login-button')?.addEventListener('click', () =>
    document.getElementById('auth-modal')?.classList.add('visible')
  );
  document.getElementById('register-button')?.addEventListener('click', () =>
    document.getElementById('auth-modal')?.classList.add('visible')
  );
  document.getElementById('close-auth')?.addEventListener('click', () =>
    document.getElementById('auth-modal')?.classList.remove('visible')
  );

  // Registrazione
  document.getElementById('register-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = e.target['register-email'].value;
    const pwd   = e.target['register-password'].value;
    auth.createUserWithEmailAndPassword(email, pwd)
      .then(() => {
        alert('Registrazione avvenuta con successo');
        document.getElementById('auth-modal')?.classList.remove('visible');
      })
      .catch(err => alert(err.message));
  });

  // Login
  document.getElementById('login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = e.target['login-email'].value;
    const pwd   = e.target['login-password'].value;
    auth.signInWithEmailAndPassword(email, pwd)
      .then(() => document.getElementById('auth-modal')?.classList.remove('visible'))
      .catch(err => alert(err.message));
  });

  // Logout
  document.getElementById('logout-button')?.addEventListener('click', () =>
    auth.signOut()
  );
});

// Sync UI con stato utente
auth.onAuthStateChanged(user => {
  document.getElementById('login-button').style.display    = user ? 'none' : 'inline-block';
  document.getElementById('register-button').style.display = user ? 'none' : 'inline-block';
  document.getElementById('logout-button').style.display   = user ? 'inline-block' : 'none';
});
