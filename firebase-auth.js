// firebase-auth.js
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('register-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = e.target['register-email'].value;
    const password = e.target['register-password'].value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => alert('Registrazione completata!'))
      .catch(err => alert(err.message));
  });

  document.getElementById('login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const email = e.target['login-email'].value;
    const password = e.target['login-password'].value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => alert('Accesso riuscito!'))
      .catch(err => alert(err.message));
  });

  document.getElementById('logout-button')?.addEventListener('click', () => {
    auth.signOut();
  });
});
