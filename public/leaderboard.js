// Auth + leaderboard service for Singularity.
//
// Nothing in here is wired into gameplay yet -- game.js/sketch.js will call
// these once the game itself is revived.
//
// Sign-in uses a popup rather than a redirect on purpose: this game shares the
// wesleyarcade.com origin with the other arcade games, and redirect-based sign
// in across two Firebase projects on one origin is fragile. Popups keep each
// game's auth flow self-contained.

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js'

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js'

import { auth, db } from './firebase-config.js'

const provider = new GoogleAuthProvider()

export function watchUser (callback) {
  return onAuthStateChanged(auth, callback)
}

export function currentUser () {
  return auth.currentUser
}

export async function signIn () {
  const { user } = await signInWithPopup(auth, provider)
  await upsertProfile(user)
  return user
}

export function signOut () {
  return fbSignOut(auth)
}

// The users doc exists so the leaderboard can show a name even for players who
// have not posted a score yet. createdAt is only written on first sight, since
// the rules pin it immutable after creation.
async function upsertProfile (user) {
  const ref = doc(db, 'users', user.uid)
  const profile = {
    displayName: displayNameFor(user),
    photoURL: user.photoURL || null,
    updatedAt: serverTimestamp()
  }

  try {
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() })
  } catch (err) {
    // Already exists: the create rule rejects a second createdAt write.
    await setDoc(ref, profile, { merge: true })
  }
}

function displayNameFor (user) {
  const name = (user.displayName || '').trim()
  if (name) return name.slice(0, 32)
  const handle = (user.email || '').split('@')[0]
  return (handle || 'Pilot').slice(0, 32)
}

/**
 * Records a finished run.
 *
 * A survival score rather than a time: the run clock was removed because this is
 * about how far you get and what you have left, not how fast. Ranked by levels
 * cleared, with craft still in hand as the tiebreak -- clearing eight levels on
 * your last craft beats clearing eight without losing one only if nobody did
 * the latter.
 */
export async function submitScore ({ levelsCleared, craftRemaining, craftId }) {
  const user = auth.currentUser
  if (!user) throw new Error('Cannot submit a score while signed out')

  return addDoc(collection(db, 'scores'), {
    uid: user.uid,
    displayName: displayNameFor(user),
    levelsCleared: Math.max(0, Math.round(levelsCleared)),
    craftRemaining: Math.max(0, Math.min(3, Math.round(craftRemaining))),
    craftId,
    createdAt: serverTimestamp()
  })
}

export async function topScores (max = 10) {
  const snap = await getDocs(query(
    collection(db, 'scores'),
    orderBy('levelsCleared', 'desc'),
    orderBy('craftRemaining', 'desc'),
    orderBy('createdAt', 'asc'),
    limit(max)
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function personalBest () {
  const user = auth.currentUser
  if (!user) return null

  const snap = await getDocs(query(
    collection(db, 'scores'),
    where('uid', '==', user.uid),
    orderBy('levelsCleared', 'desc'),
    orderBy('craftRemaining', 'desc'),
    limit(1)
  ))
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}
