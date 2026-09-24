// Firebase - Reunião Sacramental Ala Piedade

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAeUj3fgSab9W17w7pB3psU9OpgF4lpgq4",
  authDomain: "reuniao-sacramental-piedade.firebaseapp.com",
  projectId: "reuniao-sacramental-piedade",
  storageBucket: "reuniao-sacramental-piedade.firebasestorage.app",
  messagingSenderId: "1014392255924",
  appId: "1:1014392255924:web:4de947bf829a204a572ee1"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

async function autenticarAnonimamente() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  await signInAnonymously(auth);

  return new Promise((resolve, reject) => {
    const cancelarObservador = onAuthStateChanged(
      auth,
      (usuario) => {
        if (usuario) {
          cancelarObservador();
          resolve(usuario);
        }
      },
      (erro) => {
        cancelarObservador();
        reject(erro);
      }
    );
  });
}

export {
  auth,
  db,
  autenticarAnonimamente
};