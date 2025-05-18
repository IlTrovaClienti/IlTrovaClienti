// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbiSZaWGRWTxA5C15TYv3IiuCTyS6WaOA",
  authDomain: "iltrovaclienti-948af.firebaseapp.com",
  projectId: "iltrovaclienti-948af",
  storageBucket: "iltrovaclienti-948af.appspot.com",
  messagingSenderId: "774644367448",
  appId: "1:774644367448:web:87bed07de4f922f959ca2d",
  measurementId: "G-JF12YKNJX6"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
function showAuthPopup() {
  const email = prompt("Inserisci email:");
  const password = prompt("Inserisci password:");
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => {
      if (err.code === 'auth/user-not-found') {
        return auth.createUserWithEmailAndPassword(email, password);
      }
      throw err;
    })
    .then(userCred => console.log("Autenticato:", userCred.user))
    .catch(console.error);
}
