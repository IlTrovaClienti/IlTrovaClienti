function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const error = document.getElementById('login-error');

  if (email === 'demo@mail.com' && password === '1234') {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-section').style.display = 'block';
    localStorage.setItem('loggedIn', 'true');
    error.textContent = '';
  } else {
    error.textContent = 'Credenziali errate.';
  }
}

window.onload = function() {
  if (localStorage.getItem('loggedIn') === 'true') {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-section').style.display = 'block';
  }
}
