import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQRmublEZkhWqyQfoWoRgjh6_MWqRxX08",
  authDomain: "ginga-financeiro.firebaseapp.com",
  projectId: "ginga-financeiro",
  storageBucket: "ginga-financeiro.firebasestorage.app",
  messagingSenderId: "530889520436",
  appId: "1:530889520436:web:94c8bacb15b39ac806e161",
  measurementId: "G-S2NCE111QP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const transactionsRef = collection(db, "transactions");

export async function saveTransaction(transaction) {
  return await addDoc(transactionsRef, transaction);
}

export async function removeTransaction(id) {
  await deleteDoc(doc(db, "transactions", id));
}

export function subscribeTransactions(onChange, onError = console.error) {
  const q = query(transactionsRef, orderBy("datetime", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const transactions = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      }));

      onChange(transactions);
    },
    onError
  );
}

export async function clearAllTransactions() {
  const snapshot = await getDocs(transactionsRef);

  await Promise.all(
    snapshot.docs.map((document) =>
      deleteDoc(doc(db, "transactions", document.id))
    )
  );
}
