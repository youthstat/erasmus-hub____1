import { GOSSIP_POINTS, GOSSIP_MIN_WORDS, MAX_GOSSIP_LENGTH } from '../config/settings.js';
import {
  collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy,
  serverTimestamp, increment, writeBatch, limit, getDoc, getDocs, runTransaction,
} from 'firebase/firestore';
import { db } from './config.js';

const list = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
// onErr — показує помилку бази на екрані замість тихого "нічого не відбувається"
const noop = () => {};

/* ---------- підписки (дані оновлюються в реальному часі) ---------- */
export const subscribeMissions = (cb, onErr = noop) =>
  onSnapshot(query(collection(db, 'missions'), orderBy('createdAt', 'asc')), (s) => cb(list(s)), onErr);

export const subscribeUsers = (cb, onErr = noop) =>
  onSnapshot(query(collection(db, 'users'), orderBy('score', 'desc')), (s) => cb(list(s)), onErr);

export const subscribeAllSubmissions = (cb, onErr = noop) =>
  onSnapshot(query(collection(db, 'submissions'), orderBy('createdAt', 'desc')), (s) => cb(list(s)), onErr);

export const subscribeMySubmissions = (uid, cb, onErr = noop) =>
  onSnapshot(query(collection(db, 'submissions'), where('userId', '==', uid)), (s) => cb(list(s)), onErr);

export const subscribePointsLog = (cb, onErr = noop) =>
  onSnapshot(query(collection(db, 'pointsLog'), orderBy('createdAt', 'desc'), limit(300)), (s) => cb(list(s)), onErr);

/* ---------- акаунти учасників ----------
   Participant = a document in `users` (added by the admin). Registration "claims" that name:
   password hash is stored in `credentials/{userId}`, the user document gets registered: true. */
async function hashPassword(userId, password) {
  const bytes = new TextEncoder().encode(`erasmus-hub|${userId}|${password}`);
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function registerAccount(userId, country, password) {
  const passHash = await hashPassword(userId, password);
  await runTransaction(db, async (tx) => {
    const uRef = doc(db, 'users', userId);
    const cRef = doc(db, 'credentials', userId);
    const [u, c] = await Promise.all([tx.get(uRef), tx.get(cRef)]);
    if (!u.exists()) throw new Error('This name no longer exists. Choose another one.');
    if (c.exists()) throw new Error('This name is already registered. Use \"Sign in\" instead.');
    tx.set(cRef, { passHash, createdAt: serverTimestamp() });
    tx.update(uRef, { country, registered: true });
  });
}

export async function checkPassword(userId, password) {
  const snap = await getDoc(doc(db, 'credentials', userId));
  if (!snap.exists() || snap.data().passHash !== (await hashPassword(userId, password))) throw new Error('Wrong password.');
}

// admin: forgot password -> the name becomes free to register again (score is kept)
export async function resetAccount(userId) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'credentials', userId));
  batch.update(doc(db, 'users', userId), { registered: false });
  await batch.commit();
}

/* ---------- користувачі ---------- */
// admin: add (no id) or edit (id) a participant
export const saveUser = ({ name, country, score }, id) =>
  id
    ? updateDoc(doc(db, 'users', id), { name, country, score: Number(score) || 0 })
    : addDoc(collection(db, 'users'), { name, country, score: Number(score) || 0, createdAt: serverTimestamp() });

export async function removeUser(uid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', uid));
  batch.delete(doc(db, 'credentials', uid));
  await batch.commit();
}

/* ---------- бали: нарахування / віднімання адміном ---------- */
export async function adjustPoints(userId, delta, reason = 'Manual') {
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', userId), { score: increment(delta) });
  batch.set(doc(collection(db, 'pointsLog')), { userId, delta, reason, createdAt: serverTimestamp() });
  await batch.commit();
}

/* ---------- місії (створює/редагує адмін) ---------- */
export const saveMission = (data, id) =>
  id
    ? updateDoc(doc(db, 'missions', id), data)
    : addDoc(collection(db, 'missions'), { ...data, createdAt: serverTimestamp() });

export const removeMission = (id) => deleteDoc(doc(db, 'missions', id));

/* ---------- виконання місій ---------- */
export const sendSubmission = (id, data) =>
  setDoc(doc(db, 'submissions', id), { ...data, status: 'pending', createdAt: serverTimestamp() });

export async function approveSubmission(s) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'submissions', s.id), { status: 'approved' });
  batch.update(doc(db, 'users', s.userId), { score: increment(s.points) });
  batch.set(doc(collection(db, 'pointsLog')), {
    userId: s.userId, delta: s.points, reason: `Mission: ${s.missionTitle}`, createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export const rejectSubmission = (id) => updateDoc(doc(db, 'submissions', id), { status: 'rejected' });

// admin: forget who completed a mission (one mission, or every mission when no id is given).
// Points that were already paid stay; participants can send the mission again.
export async function clearSubmissions(missionId = null) {
  const q = missionId ? query(collection(db, 'submissions'), where('missionId', '==', missionId)) : collection(db, 'submissions');
  const snap = await getDocs(q);
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return snap.docs.length;
}

/* ---------- Rattie Patty: госіпи за бали ----------
   gossips/{hash} — one document per (participant, text). The id is a hash of both, so the same gossip from the
   same person cannot be paid twice (Rattie wants something NEW). Only the admin page reads this collection:
   participants never see each other's gossips. The sender chooses: anonymous (no author stored) or with their name.
   Every gossip longer than three words gives GOSSIP_POINTS; a participant can send as many as they like. */
export { GOSSIP_POINTS, GOSSIP_MIN_WORDS, MAX_GOSSIP_LENGTH };   // values live in src/config/settings.js
export const pts = (n) => `${n} ${n === 1 ? 'point' : 'points'}`;
export const countWords = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;

export const subscribeGossips = (cb, onErr = noop) =>
  onSnapshot(query(collection(db, 'gossips'), orderBy('createdAt', 'desc'), limit(500)), (s) => cb(list(s)), onErr);

// the id is only a hash of (person + text): it blocks repeats but does not reveal the author of an anonymous gossip
// admin: delete every gossip (points already paid stay). The repeat-protection goes with them, so old texts can be sent again.
export async function clearGossips() {
  const snap = await getDocs(collection(db, 'gossips'));
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return snap.docs.length;
}

// admin: delete one gossip (the points already paid stay)
export const deleteGossip = (id) => deleteDoc(doc(db, 'gossips', id));

/* ---------- Gossip board (read-only page for participants) ----------
   settings/gossips  { open: boolean, passHash }   The admin sets a password and opens the board; participants read only with it. */
const boardHash = async (password) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`gossip-board|${String(password).trim()}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
};
export const subscribeGossipAccess = (cb, onErr = noop) =>
  onSnapshot(doc(db, 'settings', 'gossips'), (s) => cb(s.exists() ? s.data() : { open: false }), onErr);
export async function openGossipBoard(password) {
  if (String(password || '').trim().length < 3) throw new Error('The password must have at least 3 characters.');
  await setDoc(doc(db, 'settings', 'gossips'), { open: true, passHash: await boardHash(password), openedAt: serverTimestamp() });
}
export const closeGossipBoard = () => setDoc(doc(db, 'settings', 'gossips'), { open: false, passHash: '' });
export const gossipPasswordOk = async (password, access) => !!access?.open && access.passHash === (await boardHash(password));
export const gossipHash = boardHash;

async function gossipId(userId, text) {
  const norm = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`kryska|${userId}|${norm}`));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sendGossip(user, rawText, showName = false) {
  const text = String(rawText || '').trim().replace(/\s+/g, ' ').slice(0, MAX_GOSSIP_LENGTH);
  const words = countWords(text);
  const fail = (code, message) => Object.assign(new Error(message), { code });
  if (words < GOSSIP_MIN_WORDS) throw fail('short', 'Too short.');
  const gRef = doc(db, 'gossips', await gossipId(user.id, text));
  await runTransaction(db, async (tx) => {
    const uRef = doc(db, 'users', user.id);
    const [g, u] = await Promise.all([tx.get(gRef), tx.get(uRef)]);
    if (!u.exists()) throw fail('nouser', 'Account not found.');
    if (g.exists()) throw fail('duplicate', 'Already told.');
    // anonymous = the author is not stored at all (not even the admin can see it); otherwise the admin sees the name
    const author = showName ? { anonymous: false, userId: user.id, userName: user.name } : { anonymous: true };
    tx.set(gRef, { ...author, text, words, points: GOSSIP_POINTS, createdAt: serverTimestamp() });
    tx.update(uRef, { score: increment(GOSSIP_POINTS) });
    // generic reason on purpose: the points log is visible to everybody, the gossip itself is not
    tx.set(doc(collection(db, 'pointsLog')), { userId: user.id, delta: GOSSIP_POINTS, reason: 'Gift from Rattie Patty', createdAt: serverTimestamp() });
  });
  return GOSSIP_POINTS;
}

/* ---------- anonymous gossip from the Gossip board page ----------
   Anyone can write here (even without an account and even while the board is closed for reading).
   The author is not stored at all and no points are paid (points are only for whispering to Rattie Patty). */
export async function sendBoardGossip(rawText) {
  const text = String(rawText || '').trim().replace(/\s+/g, ' ').slice(0, MAX_GOSSIP_LENGTH);
  if (text.length < 3) throw new Error('Write a little more.');
  await addDoc(collection(db, 'gossips'), { anonymous: true, text, words: countWords(text), points: 0, via: 'board', createdAt: serverTimestamp() });
}

/* ---------- Home screen: which blocks participants see ----------
   settings/home  { hidden: { [sectionId]: true } }   (admin changes it in Admin panel → Home screen) */
export const subscribeHomeConfig = (cb, onErr = noop) =>
  onSnapshot(doc(db, 'settings', 'home'), (s) => cb((s.exists() && s.data().hidden) || {}), onErr);
export const setHomeHidden = (id, hidden) => setDoc(doc(db, 'settings', 'home'), { hidden: { [id]: !!hidden } }, { merge: true });
export const setAllHomeHidden = (ids, hidden) => setDoc(doc(db, 'settings', 'home'), { hidden: Object.fromEntries(ids.map((id) => [id, !!hidden])) }, { merge: true });
