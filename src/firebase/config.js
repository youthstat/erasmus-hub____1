import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Конфіг Firebase прямо в коді (без .env). Ці ключі — публічні ідентифікатори веб-застосунку,
// захист даних забезпечують правила Firestore (firestore.rules), а не секретність ключа.
const firebaseConfig = {
  apiKey: 'AIzaSyAYo6e6ByHAVvYlDHXciH3-6mmhLgQNDok',
  authDomain: 'erasmus-2f278.firebaseapp.com',
  databaseURL: 'https://erasmus-2f278-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'erasmus-2f278',
  storageBucket: 'erasmus-2f278.firebasestorage.app',
  messagingSenderId: '662037690308',
  appId: '1:662037690308:web:610308b3bbced4bac7d691',
  measurementId: 'G-BDT64NC9Y4',
};

export const firebaseConfigured = true;

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
