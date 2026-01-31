// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC9H2hq_3yEtFcsvYcUo9eOk9aGxw-TLgI",
    authDomain: "niley-mall.firebaseapp.com",
    projectId: "niley-mall",
    storageBucket: "niley-mall.firebasestorage.app",
    messagingSenderId: "120593904049",
    appId: "1:120593904049:web:683b0431f370e21c3f4d90",
    measurementId: "G-CNX1HKR6Z4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
