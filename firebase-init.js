// firebase-init.js

// La tua configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAbiSZaWGRWTxA5C15TYv3IiuCTyS6WaOA",
  authDomain: "iltrovaclienti-948af.firebaseapp.com",
  projectId: "iltrovaclienti-948af",
  storageBucket: "iltrovaclienti-948af.appspot.com",
  messagingSenderId: "774644367448",
  appId: "1:774644367448:web:87bed07de4f922f959ca2d",
  measurementId: "G-JF12YKNJX6"
};

// Inizializzo Firebase
firebase.initializeApp(firebaseConfig);

// Esporto l’istanza di Auth su window, così non devo riscrivere `const auth` altrove
window.auth = firebase.auth();
