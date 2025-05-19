// Dichiaralo qui, **una sola volta**
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
  // ... tutto il tuo codice di login/register/logout ...
});

auth.onAuthStateChanged(user => {
  // ... sync UI con stato utente ...
});
