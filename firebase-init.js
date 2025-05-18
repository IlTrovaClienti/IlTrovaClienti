// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyAbiSZaWGRWTxA5C15TYv3IiuCTyS6WaOA",
  authDomain: "iltrovaclienti-948af.firebaseapp.com",
  projectId: "iltrovaclienti-948af",
  storageBucket: "iltrovaclienti-948af.appspot.com",
  messagingSenderId: "774644367448",
  appId: "1:774644367448:web:87bed07de4f922f959ca2d",
  measurementId: "G-JF12YKNJX6"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Auth UI logic (login/register popup)
function showAuthPopup() {
  const email = prompt("Inserisci email:");
  const password = prompt("Inserisci password:");
  auth.signInWithEmailAndPassword(email, password)
    .then(userCred => {
      console.log('Utente loggato:', userCred.user);
    })
    .catch(error => {
      if (error.code === 'auth/user-not-found') {
        auth.createUserWithEmailAndPassword(email, password)
          .then(userCred => console.log('Utente registrato:', userCred.user))
          .catch(err => console.error(err));
      } else {
        console.error(error);
      }
    });
}
