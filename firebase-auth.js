// firebase-auth.js
document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const loginBtn = document.getElementById('login-button');
  const regBtn   = document.getElementById('register-button');
  const outBtn   = document.getElementById('logout-button');
  const authModal= document.getElementById('auth-modal');
  const showLogin= document.getElementById('show-login');
  const showReg  = document.getElementById('show-register');
  const loginForm= document.getElementById('login-form');
  const regForm  = document.getElementById('register-form');
  const closeAuth= document.getElementById('close-auth');

  // Open modal
  loginBtn?.addEventListener('click', () => { authModal.classList.add('visible'); showLogin.click(); });
  regBtn?.addEventListener('click',   () => { authModal.classList.add('visible'); showReg.click(); });
  closeAuth?.addEventListener('click',() => authModal.classList.remove('visible'));

  // Toggle tabs
  showLogin.addEventListener('click',() => {
    showLogin.classList.add('active'); showReg.classList.remove('active');
    loginForm.classList.add('active'); regForm.classList.remove('active');
  });
  showReg.addEventListener('click',() => {
    showReg.classList.add('active'); showLogin.classList.remove('active');
    regForm.classList.add('active'); loginForm.classList.remove('active');
  });

  // Register
  regForm?.addEventListener('submit', e => {
    e.preventDefault();
    const email = regForm['register-email'].value;
    const pwd   = regForm['register-password'].value;
    auth.createUserWithEmailAndPassword(email,pwd)
      .then(cred => cred.user.sendEmailVerification())
      .then(() => { alert('Verifica inviata!'); regForm.reset(); authModal.classList.remove('visible'); })
      .catch(err => document.getElementById('register-error').textContent = err.message);
  });

  // Login
  loginForm?.addEventListener('submit', e => {
    e.preventDefault();
    const email = loginForm['login-email'].value;
    const pwd   = loginForm['login-password'].value;
    auth.signInWithEmailAndPassword(email,pwd)
      .then(() => { loginForm.reset(); authModal.classList.remove('visible'); })
      .catch(err => document.getElementById('login-error').textContent = err.message);
  });

  // Logout
  outBtn?.addEventListener('click', () => auth.signOut());

  // Auth state
  auth.onAuthStateChanged(user => {
    const logged = !!user;
    loginBtn.style.display    = logged ? 'none' : '';
    regBtn.style.display      = logged ? 'none' : '';
    outBtn.style.display      = logged ? '' : 'none';
    document.body.classList.toggle('user-logged-in', logged);
  });
});
