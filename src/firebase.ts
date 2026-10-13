import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// UTL G-Fi primary Firebase project (project `utl-g-fi-ce9e3`).
// These web config values are NOT secrets — every Firebase web client ships
// them publicly. Your data is protected by Firebase Auth (your login) + the
// project's security rules. Recovered from the official web app
// (utlsmartsystems.com / main.dart.js).
const firebaseConfig = {
  apiKey: 'AIzaSyDqjmfn630pyuxtM1B7MyJGGxtjf0p2L48',
  authDomain: 'utl-g-fi-ce9e3.firebaseapp.com',
  databaseURL: 'https://utl-g-fi-ce9e3-default-rtdb.firebaseio.com',
  projectId: 'utl-g-fi-ce9e3',
  storageBucket: 'utl-g-fi-ce9e3.appspot.com',
  messagingSenderId: '683503852013',
  appId: '1:683503852013:web:8592ce0721660ee3d6afe4',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
