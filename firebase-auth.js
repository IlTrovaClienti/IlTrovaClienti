// firebase-auth.js
// Non dichiariamo più `const auth` qui, lo prende da firebase-init.js

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn      = document.getElementById('login-button');
  const registerBtn   = document.getElementById('register-button');
  const logoutBtn     = document.getElementById('logout-button');
  const authModal     = document.getElementById('auth-modal');
  const showLoginTab  = document.getElementById('show-login');
  const showRegTab    = document.getElementById('show-register');
  const loginForm     = document.getElementById('login-form');
  const registerForm  = document.getElementById('register-form');
  const closeAuthBtn  = document.getElementById('close-auth');
  const loginError    = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');

  loginBtn.addEventListener('click', () => {
    authModal.classList.add('visible');
    showLoginTab.click();
  });
  registerBtn.addEventListener('click', () => {
    authModal.classList.add('visible');
    showRegTab.click();
  });
  closeAuthBtn.addEventListener('click', () => {
    authModal.classList.remove('visible');
  });

  showLoginTab.addEventListener('click', () => {
    showLoginTab.classList.add('active');
    showRegTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
    loginError.textContent = '';
    registerError.textContent = '';
  });
  showRegTab.addEventListener('click', () => {
    showRegTab.classList.add('active');
    showLoginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
    loginError.textContent = '';
    registerError.textContent = '';
  });

  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    registerError.textContent = '';
    const email = registerForm['register-email'].value;
    const pwd   = registerForm['register-password'].value;
    if (registerForm['register-password2'].value !== pwd) {
      return registerError.textContent = 'Password non corrispondono';
    }
    if (registerForm['register-captcha'].value.trim() !== '5') {
      return registerError.textContent = 'Captcha errato';
    }
    auth.createUserWithEmailAndPassword(email, pwd)
      .then(cred => cred.user.sendEmailVerification())
      .then(() => {
        alert('Verifica inviata! Controlla la tua email.');
        registerForm.reset();
        authModal.classList.remove('visible');
      })
      .catch(err => registerError.textContent = err.message);
  });

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    loginError.textContent = '';
    const email = loginForm['login-email'].value;
    const pwd   = loginForm['login-password'].value;
    if (loginForm['login-captcha'].value.trim() !== '5') {
      return loginError.textContent = 'Captcha errato';
    }
    auth.signInWithEmailAndPassword(email, pwd)
      .then(() => {
        loginForm.reset();
        authModal.classList.remove('visible');
      })
      .catch(err => loginError.textContent = err.message);
  });

  logoutBtn.addEventListener('click', () => auth.signOut());

  auth.onAuthStateChanged(user => {
    const logged = !!user;
    loginBtn.style.display    = logged ? 'none' : '';
    registerBtn.style.display = logged ? 'none' : '';
    logoutBtn.style.display   = logged ? '' : 'none';
    document.body.classList.toggle('user-logged-in', logged);
  });
});
