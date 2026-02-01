
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC0dD9cpnRShhsaEeZiWNnC7BhUT9PNRAo",
  authDomain: "gamified-lifecraftai.firebaseapp.com",
  projectId: "gamified-lifecraftai",
  storageBucket: "gamified-lifecraftai.firebasestorage.app",
  messagingSenderId: "288776909559",
  appId: "1:288776909559:web:780acdc5f6784739eb19f2"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);