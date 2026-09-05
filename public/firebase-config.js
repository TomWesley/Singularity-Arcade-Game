// Firebase bootstrap for Singularity.
//
// Project: singularitythegame -- auth and leaderboard data only. Hosting is
// owned by the WesleyArcadeSite repo, which serves this game at
// wesleyarcade.com/singularity/. Keeping the two apart means a deploy of the
// arcade can never clobber this game's security rules, and vice versa.
//
// These values are not secrets. A Firebase web config is public by design;
// access is controlled by firestore.rules and the authorized-domain list.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js'

const firebaseConfig = {
  apiKey: 'AIzaSyC7EyTMAknfHKwM8X1vCUeLg--8bxMMjrY',
  authDomain: 'singularitythegame.firebaseapp.com',
  projectId: 'singularitythegame',
  storageBucket: 'singularitythegame.firebasestorage.app',
  messagingSenderId: '862206726767',
  appId: '1:862206726767:web:1da2a558bf32b5f8bf339a'
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
