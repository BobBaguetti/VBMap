// firebase.js
import * as firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Replace these values with your Firebase configuration.
const firebaseConfig = {
  apiKey: "AIzaSyDwEdPK3UdPN5MB8YAuM_jb0K1iXfQ-tGQ",
  authDomain: "vbmap-cc834.firebaseapp.com",
  projectId: "vbmap-cc834",
  storageBucket: "vbmap-cc834.firebasestorage.app",
  messagingSenderId: "244112699360",
  appId: "1:244112699360:web:95f50adb6e10b438238585",
  measurementId: "G-7FDNWLRM95"
};

firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();
