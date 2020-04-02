import * as firebase from 'firebase'; 

const firebaseConfig = {
  apiKey: "AIzaSyC6wFB2w_YvuBQCR5n1cEC3jSBJX2Jmhkw",
  authDomain: "ak-entertainment.firebaseapp.com",
  databaseURL: "https://ak-entertainment.firebaseio.com",
  projectId: "ak-entertainment",
  storageBucket: "ak-entertainment.appspot.com",
  messagingSenderId: "507720390016",
  appId: "1:507720390016:web:cc614ae26903b900"
}; 
firebase.initializeApp(firebaseConfig);
export default firebase;
