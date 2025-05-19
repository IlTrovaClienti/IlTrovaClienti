// firebase-auth.js
const auth = firebase.auth();
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn    = document.getElementById('login-button');
  const registerBtn = document.getElementById('register-button');
  const logoutBtn   = document.getElementById('logout-button');
  const authModal   = document.getElementById('auth-modal');
  const showLogin   = document.getElementById('show-login');
  const showRegister= document.getElementById('show-register');
  const loginForm   = document.getElementById('login-form');
  const registerForm= document.getElementById('register-form');
  const closeAuth   = document.getElementById('close-auth');
  const loginError  = document.getElementById('login-error');
  const regError    = document.getElementById('register-error');

  loginBtn.addEventListener('click', () => { authModal.classList.add('visible'); showLogin.click(); });
  registerBtn.addEventListener('click', () => { authModal.classList.add('visible'); showRegister.click(); });
  closeAuth.addEventListener('click', () => authModal.classList.remove('visible'));

  showLogin.addEventListener('click', () => {
    showLogin.classList.add('active'); showRegister.classList.remove('active');
    loginForm.classList.add('active'); registerForm.classList.remove('active');
    loginError.textContent = ''; regError.textContent = '';
  });
  showRegister.addEventListener('click', () => {
    showRegister.classList.add('active'); showLogin.classList.remove('active');
    registerForm.classList.add('active'); loginForm.classList.remove('active');
    loginError.textContent = ''; regError.textContent = '';
  });

  registerForm.addEventListener('submit', e => {
    e.preventDefault(); regError.textContent = '';
    const email = registerForm['register-email'].value;
    const pwd   = registerForm['register-password'].value;
    if (registerForm['register-password2'].value !== pwd)
      return regError.textContent = 'Password non corrispondono';
    if (registerForm['register-captcha'].value.trim() !== '5')
      return regError.textContent = 'Captcha errato';
    auth.createUserWithEmailAndPassword(email,pwd)
      .then(cred => cred.user.sendEmailVerification())
      .then(() => { alert('Verifica inviata!'); registerForm.reset(); authModal.classList.remove('visible'); })
      .catch(err => regError.textContent = err.message);
  });

  loginForm.addEventListener('submit', e => {
    e.preventDefault(); loginError.textContent = '';
    const email = loginForm['login-email'].value;
    const pwd   = loginForm['login-password'].value;
    if (loginForm['login-captcha'].value.trim() !== '5')
      return loginError.textContent = 'Captcha errato';
    auth.signInWithEmailAndPassword(email,pwd)
      .then(() => { loginForm.reset(); authModal.classList.remove('visible'); })
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
