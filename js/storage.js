// Firebase Realtime Database storage (with anonymous auth + batching)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getDatabase, ref, set, push, update, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

let app, db, auth;
let sessionId = null;

// batching
const BUFFER_SIZE = 5;
let buffer = [];

export async function initFirebase(cfg){
  app = initializeApp(cfg);
  db = getDatabase(app);
  auth = getAuth(app);
}

export async function signInAnon(){
  if(!auth) throw new Error('Firebase non inizializzato');
  await signInAnonymously(auth);
}

function makeSessionId(){
  return 'sess_' + new Date().toISOString().replace(/[:.]/g,'-') + '_' + Math.random().toString(36).slice(2,8);
}

export async function startSession(meta){
  if(!db) throw new Error('DB non inizializzato');
  sessionId = makeSessionId();
  await set(ref(db, 'sessions/' + sessionId), {
    ...meta,
    createdAt: serverTimestamp()
  });
  buffer = [];
  return sessionId;
}

export async function savePoint(point){
  if(!sessionId) return;
  buffer.push(point);
  if (buffer.length >= BUFFER_SIZE){
    const base = 'sessions/' + sessionId + '/points';
    const updates = {};
    buffer.forEach(p => {
      const k = push(ref(db, base)).key;
      updates[base + '/' + k] = { ...p, ingestTime: serverTimestamp() };
    });
    await update(ref(db), updates);
    buffer = [];
  }
}

export async function endSession(){
  if(!sessionId) return;
  // flush rest
  if (buffer.length){
    const base = 'sessions/' + sessionId + '/points';
    const updates = {};
    buffer.forEach(p => {
      const k = push(ref(db, base)).key;
      updates[base + '/' + k] = { ...p, ingestTime: serverTimestamp() };
    });
    await update(ref(db), updates);
    buffer = [];
  }
  // write endAt
  await set(ref(db, 'sessions/' + sessionId + '/endedAt'), serverTimestamp());
  sessionId = null;
}
