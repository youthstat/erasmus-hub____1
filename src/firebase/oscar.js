import { collection, doc, getDoc, getDocs, onSnapshot, runTransaction, setDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './config.js';
import { MAX_TEAM_SIZE } from '../config/settings.js';

/*
  Oscar Night — Firestore
  teams/{teamId}         { title, directorId, memberIds[], createdBy, nominated, nominations{ questionId: [userId] | true }, ... }
  teamLocks/{userId}     { teamId }   one person = one crew (written in the same transaction as the team)
  oscarConfig/main       { status: 'draft' | 'open' | 'closed', questions[] }   (only the admin changes it)
  oscarVotes/{userId}    { userId, answers{ questionId: optionId | text }, createdAt }   the document id guarantees ONE ballot per person
  Option ids: a person = "teamId|userId", a film = "teamId".
*/
export const MIN_TEAM_SIZE = 2;
const fail = (code, message) => Object.assign(new Error(message), { code });
const list = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));

export const subscribeTeams = (cb, onErr) => onSnapshot(collection(db, 'teams'), (s) => cb(list(s)), onErr);
export const subscribeOscarConfig = (cb, onErr) => onSnapshot(doc(db, 'oscarConfig', 'main'), (s) => cb(s.exists() ? s.data() : null), onErr);
export const subscribeMyVote = (userId, cb, onErr) => onSnapshot(doc(db, 'oscarVotes', userId), (s) => cb(s.exists()), onErr);
export const subscribeVotes = (cb, onErr) => onSnapshot(collection(db, 'oscarVotes'), (s) => cb(list(s)), onErr);

// admin: the whole config is written at once { status, questions }
// intake = 'open' | 'closed' : do crews still send themselves to the voting (independent of the voting status)
// expectedTeams = number of crews we wait for (0 = no limit); when that many crews have been sent, the intake stops by itself
export const saveOscarConfig = (cfg) => setDoc(doc(db, 'oscarConfig', 'main'), {
  status: cfg.status, questions: cfg.questions, intake: cfg.intake || 'open', expectedTeams: Number(cfg.expectedTeams) || 0,
});

// admin: delete every ballot, so everybody can vote again (document id = user id)
export async function clearVotes() {
  const snap = await getDocs(collection(db, 'oscarVotes'));
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return snap.docs.length;
}

const prune = (nominations, memberIds) => {
  const out = {};
  for (const [q, v] of Object.entries(nominations || {})) out[q] = Array.isArray(v) ? v.filter((u) => memberIds.includes(u)) : v;
  return out;
};

/* Locks (the admin is never locked):
   - as soon as the admin opens the voting nobody can create or change a crew any more;
   - as soon as a crew has been sent to the voting, it cannot be changed or taken back by the crew.
     Only the admin can return it to editing (returnToEditing). */
const VOTING_STARTED = 'The voting has started — crews can no longer be changed.';
const SENT_LOCKED = 'Your crew has been sent to the voting. Nothing can be changed now — only the organizers can return it to editing.';

/* create or edit a crew. Everybody can be in only one crew (teamLocks). */
export async function saveTeam({ title, directorId, memberIds }, id, creatorId, nameOf, isAdmin = false) {
  const name = String(title || '').trim();
  const members = [...new Set(memberIds)];
  if (!name) throw fail('title', 'Write the title of your film.');
  if (members.length < MIN_TEAM_SIZE) throw fail('size', `A crew needs at least ${MIN_TEAM_SIZE} people.`);
  if (members.length > MAX_TEAM_SIZE) throw fail('size', `A crew can have at most ${MAX_TEAM_SIZE} people.`);
  if (!members.includes(directorId)) throw fail('director', 'The director must be one of the crew members.');
  const ref = id ? doc(db, 'teams', id) : doc(collection(db, 'teams'));
  await runTransaction(db, async (tx) => {
    const old = id ? await tx.get(ref) : null;
    const cfgSnap = await tx.get(doc(db, 'oscarConfig', 'main'));
    const prev = old?.exists() ? old.data() : null;
    if (id && !prev) throw fail('missing', 'This crew no longer exists.');
    if (!isAdmin) {
      if (cfgSnap.exists() && cfgSnap.data().status && cfgSnap.data().status !== 'draft') throw fail('locked', VOTING_STARTED);
      if (prev?.nominated) throw fail('locked', SENT_LOCKED);
    }
    const locks = await Promise.all(members.map((u) => tx.get(doc(db, 'teamLocks', u))));
    locks.forEach((l, i) => { if (l.exists() && l.data().teamId !== ref.id) throw fail('taken', `${nameOf(members[i])} is already in another crew.`); });
    (prev?.memberIds || []).filter((u) => !members.includes(u)).forEach((u) => tx.delete(doc(db, 'teamLocks', u)));
    members.forEach((u) => tx.set(doc(db, 'teamLocks', u), { teamId: ref.id }));
    if (prev) tx.update(ref, { title: name, directorId, memberIds: members, nominations: prune(prev.nominations, members), updatedAt: serverTimestamp() });
    else tx.set(ref, { title: name, directorId, memberIds: members, createdBy: creatorId || null, nominated: false, nominations: {}, createdAt: serverTimestamp() });
  });
  return ref.id;
}

export async function removeTeam(id) {
  const snap = await getDoc(doc(db, 'teams', id));
  const batch = writeBatch(db);
  (snap.data()?.memberIds || []).forEach((u) => batch.delete(doc(db, 'teamLocks', u)));
  batch.delete(doc(db, 'teams', id));
  await batch.commit();
}

/* the crew sends its candidates to the voting. Allowed only while the voting has not started, the admin keeps
   the crew intake open and the expected number of crews is not reached. After sending, only the admin can change anything. */
export async function nominateTeam(teamId, nominations, cover, isAdmin = false) {
  const all = (await getDocs(collection(db, 'teams'))).docs.map((d) => ({ id: d.id, ...d.data() }));
  await runTransaction(db, async (tx) => {
    const cfgSnap = await tx.get(doc(db, 'oscarConfig', 'main'));
    const cfg = cfgSnap.exists() ? cfgSnap.data() : {};
    const me = all.find((t) => t.id === teamId);
    if (!isAdmin) {
      if (cfg.status && cfg.status !== 'draft') throw fail('locked', VOTING_STARTED);
      if (me?.nominated) throw fail('locked', SENT_LOCKED);
    }
    if (cfg.intake === 'closed') throw fail('locked', 'The organizers have closed the intake of crews.');
    if (cfg.expectedTeams > 0 && !me?.nominated && all.filter((t) => t.nominated).length >= cfg.expectedTeams)
      throw fail('full', 'All expected crews have already been sent to the voting.');
    tx.update(doc(db, 'teams', teamId), { nominated: true, nominations, ...(cover ? { cover } : {}), nominatedAt: serverTimestamp() });
  });
}
// admin only: give the crew back to the team so it can edit and send again
export async function returnToEditing(teamId) {
  await updateDoc(doc(db, 'teams', teamId), { nominated: false });
}

/* one ballot per person: the document id is the user id, and it is created in a transaction */
export async function submitVote(userId, answers) {
  await runTransaction(db, async (tx) => {
    const cfg = await tx.get(doc(db, 'oscarConfig', 'main'));
    if (!cfg.exists() || cfg.data().status !== 'open') throw fail('closed', 'The voting is not open.');
    const ref = doc(db, 'oscarVotes', userId);
    if ((await tx.get(ref)).exists()) throw fail('voted', 'You have already voted.');
    tx.set(ref, { userId, answers, createdAt: serverTimestamp() });
  });
}
