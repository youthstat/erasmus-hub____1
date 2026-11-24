import { collection, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, runTransaction, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './config.js';

/*
  Firestore collections
  Secret friend:  sfPlayers/{userId}   sfClaims/{targetId}
  Killer game:    kgPlayers/{userId}   kgClaims/{targetId}   kgItemClaims/{ownerId}
  Settings:       gameConfig/{sf|kg}   -> { excluded: [userId, ...] }  (people the admin switched off)

  userId = id of the document in `users` (a person from the leaderboard).
  *Claims are locks: a targetId document exists while somebody is hunting / is secret friend of that person.
  Transactions on these documents guarantee that one name is never given to two players.
*/
export const GAMES = {
  sf: { players: 'sfPlayers', claims: 'sfClaims' },
  kg: { players: 'kgPlayers', claims: 'kgClaims', itemClaims: 'kgItemClaims' },
};

export const isJoined = (p) => !!(p && (p.joined || p.pinHash));   // pinHash = old accounts
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fail = (code, message) => Object.assign(new Error(message), { code });
const readPlayers = async (game) =>
  (await getDocs(collection(db, GAMES[game].players))).docs.map((d) => ({ id: d.id, ...d.data() }));

/* ---------- live subscriptions ---------- */
export const subscribePlayers = (game, cb, onErr) =>
  onSnapshot(collection(db, GAMES[game].players), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), onErr);

export const subscribeExcluded = (game, cb, onErr) =>
  onSnapshot(collection(db, 'gameConfig'), (s) => {
    const d = s.docs.find((x) => x.id === game);
    cb((d && d.data().excluded) || []);
  }, onErr);

/* ---------- join ----------
   The participant is already signed in to their account, so nothing is typed except
   the item in Killer game. */
export async function joinGame(game, userId, item, wishes = {}) {
  const ref = doc(db, GAMES[game].players, userId);
  const snap = await getDoc(ref);
  if (snap.exists() && isJoined(snap.data())) throw fail('exists', 'You have already joined this game.');
  if (snap.exists() && snap.data().dead) throw fail('dead', 'You have been eliminated and cannot join.');
  const data = { userId, joined: true, targetId: null, targetName: null, joinedAt: serverTimestamp() };
  if (game === 'sf') Object.assign(data, { likes: String(wishes.likes || '').trim().slice(0, 400), dislikes: String(wishes.dislikes || '').trim().slice(0, 400) });
  if (game === 'kg') Object.assign(data, { item: String(item || '').trim(), itemOwnerId: null, itemText: null, kills: 0, dead: false });
  await setDoc(ref, data);
}

/* Secret friend: what I like / do not like. The person who got my name (my secret friend) sees it. */
export const saveWishes = (userId, likes, dislikes) =>
  updateDoc(doc(db, GAMES.sf.players, userId), { likes: String(likes || '').trim().slice(0, 400), dislikes: String(dislikes || '').trim().slice(0, 400) });

/* ---------- assignment ----------
  Everyone who plays is a node of a graph "who -> whom". Each new assignment is an edge giver -> target.
  The picking rules guarantee:
   - target is never the giver;  - every person is given to only one player;
   - all edges grow into ONE closed circle (A->B->C->...->A), so nobody is left in a dead end
     and in Killer game the chain "the victim's contract is inherited" is closed.
*/
export function pickTarget(userIds, edges, giver) {
  if (userIds.length < 2) return null;
  const valid = new Set(userIds);
  const claimed = new Set();
  const prev = new Map();
  for (const [a, b] of edges) if (valid.has(a) && valid.has(b)) { claimed.add(b); prev.set(b, a); }

  // start of the chain that ends with `giver`
  let start = giver, steps = 0;
  while (prev.has(start) && steps <= userIds.length) { start = prev.get(start); steps++; }

  const free = userIds.filter((u) => !claimed.has(u));       // chain starts
  const otherChains = free.filter((u) => u !== start && u !== giver);
  if (otherChains.length) return pick(otherChains);
  // one chain left: close the circle only when everybody is in it
  if (free.length === 1 && free[0] === start && start !== giver && steps + 1 === userIds.length) return start;
  return null;
}

/* Killer game: objects are mixed between players and have nothing to do with names.
   - nobody ever gets the object they wrote themselves;
   - when possible the object is not the one written by the victim either (so object and name stay unrelated);
   - a pick is refused if it would leave some other player who still waits for an object with nothing but their own. */
function canAssign(drawers, freeItems) {
  const holder = new Map();                                   // object (owner id) -> drawer who would get it
  const place = (d, seen) => {
    for (const it of freeItems) {
      if (it === d || seen.has(it)) continue;
      seen.add(it);
      if (!holder.has(it) || place(holder.get(it), seen)) { holder.set(it, d); return true; }
    }
    return false;
  };
  return drawers.every((d) => place(d, new Set()));
}

export function pickItem(players, takenIds, userId, targetId) {
  const taken = new Set([...takenIds, ...players.map((p) => p.itemOwnerId).filter(Boolean)]);
  const free = players.filter((p) => p.item && !taken.has(p.id)).map((p) => p.id);
  const waiting = players.filter((p) => isJoined(p) && !p.dead && !p.targetId && !p.itemText && p.id !== userId).map((p) => p.id);
  const notMine = free.filter((id) => id !== userId);
  let options = notMine.filter((id) => canAssign(waiting, free.filter((x) => x !== id)));
  if (!options.length) options = notMine;
  if (!options.length) return null;
  const unrelated = options.filter((id) => id !== targetId);
  return pick(unrelated.length ? unrelated : options);
}

// userIds = people who play this game (admin-enabled, not eliminated)
export async function claimResult(game, userId, userIds, nameOf) {
  const cfg = GAMES[game];
  for (let attempt = 0; attempt < 6; attempt++) {
    const players = await readPlayers(game);
    const me = players.find((p) => p.id === userId);
    if (!isJoined(me)) throw fail('missing', 'Join the game first.');
    if (me.dead) throw fail('dead', 'You have been eliminated.');
    if (me.targetId) return me;

    const deadIds = new Set(players.filter((p) => p.dead).map((p) => p.id));
    const pool = userIds.filter((id) => !deadIds.has(id));
    const edges = players.filter((p) => p.targetId && !p.dead).map((p) => [p.id, p.targetId]);
    const targetId = pickTarget(pool, edges, userId);
    if (!targetId) throw fail('none', 'No free name is available yet. Ask the organizers to enable more players.');

    let itemOwner = null;
    if (game === 'kg' && !me.itemText) {      // the object is drawn once; a killer who lost the contract keeps the inherited object
      const locks = (await getDocs(collection(db, cfg.itemClaims))).docs.map((d) => d.id);
      const ownerId = pickItem(players, locks, userId, targetId);
      if (!ownerId) throw fail('none', 'No object from another player is available yet. Objects are mixed between players, so you never get your own. Try again when more people have joined.');
      itemOwner = players.find((p) => p.id === ownerId);
    }

    try {
      return await runTransaction(db, async (tx) => {
        const meRef = doc(db, cfg.players, userId);
        const claimRef = doc(db, cfg.claims, targetId);
        const itemRef = itemOwner ? doc(db, cfg.itemClaims, itemOwner.id) : null;
        const [meSnap, claimSnap, itemSnap] = await Promise.all([tx.get(meRef), tx.get(claimRef), itemRef ? tx.get(itemRef) : null]);
        if (meSnap.data().targetId) return { id: userId, ...meSnap.data() };
        if (claimSnap.exists() || (itemSnap && itemSnap.exists())) throw fail('retry', 'retry');
        const patch = { targetId, targetName: nameOf(targetId) };
        tx.set(claimRef, { byUserId: userId });
        if (itemOwner) {
          Object.assign(patch, { itemOwnerId: itemOwner.id, itemText: itemOwner.item });
          tx.set(itemRef, { byUserId: userId });
        }
        tx.update(meRef, patch);
        return { id: userId, ...meSnap.data(), ...patch };
      });
    } catch (e) {
      if (e.code !== 'retry') throw e;       // somebody took it at the same moment: try again
    }
  }
  throw fail('busy', 'Too many people at once. Press the button again.');
}

/* ---------- Killer game: elimination ----------
  killerId = the hunter who killed the victim (button in the game) or null (admin removed the player).
  The hunter inherits the victim's contract: the victim's target and the victim's item.
  If the victim had not received a target yet, the hunter simply draws a new one with the button.
*/
export async function killPlayer(victimId, killerId, nameOf) {
  const cfg = GAMES.kg;
  return runTransaction(db, async (tx) => {
    const vRef = doc(db, cfg.players, victimId);
    const vSnap = await tx.get(vRef);
    const v = vSnap.exists() ? vSnap.data() : {};
    if (v.dead) throw fail('dead', 'This player is already eliminated.');
    const kRef = killerId ? doc(db, cfg.players, killerId) : null;
    const kSnap = kRef ? await tx.get(kRef) : null;
    if (kSnap) {
      const k = kSnap.data();
      if (k.dead) throw fail('dead', 'You have been eliminated.');
      if (k.targetId !== victimId) throw fail('target', 'This is no longer your victim.');
    }
    const next = v.targetId || null;
    const dead = { dead: true, killedBy: killerId || null, killedAt: serverTimestamp(), targetId: v.targetId || null, killUndo: null };
    tx.delete(doc(db, cfg.claims, victimId));                              // nobody hunts the dead player any more
    if (kSnap) {
      const k = kSnap.data();
      const last = next === killerId;                                      // only the killer is left
      // what the hunter had before, so that "Revive" can give it back exactly
      dead.killUndo = { itemText: k.itemText ?? null, itemOwnerId: k.itemOwnerId ?? null, kills: k.kills || 0 };
      const patch = { targetId: last ? null : next, targetName: last || !next ? null : nameOf(next), kills: (k.kills || 0) + 1 };
      // the hunter inherits the victim's object, unless it is the hunter's own (nobody holds the object they wrote)
      if (v.itemText && (v.itemOwnerId !== killerId || !k.itemText)) Object.assign(patch, { itemText: v.itemText, itemOwnerId: v.itemOwnerId || null });
      if (next && !last) tx.set(doc(db, cfg.claims, next), { byUserId: killerId });
      else if (next) tx.delete(doc(db, cfg.claims, next));
      tx.update(kRef, patch);
    } else if (next) {
      tx.delete(doc(db, cfg.claims, next));                                // the dead player's victim is free again
    }
    if (vSnap.exists()) tx.update(vRef, dead); else tx.set(vRef, { userId: victimId, ...dead });
  });
}

/* ---------- admin: bring a killed player back (an accidental "I killed my victim", a wrong click) ----------
  Undoes killPlayer: the victim is alive again, the hunter gets the victim back as the target (and their own
  previous item and kill count), and the victim hunts their old target again.
  It only works while the hunter has not moved on; if the hunter already killed again, revive the later victim first
  (undo in reverse order), otherwise the chain would break. */
export async function revivePlayer(victimId, nameOf) {
  const cfg = GAMES.kg;
  // legacy kills (before killUndo existed): find the hunter's previous item among their item locks
  const itemLocks = (await getDocs(collection(db, cfg.itemClaims))).docs.map((d) => ({ id: d.id, ...d.data() }));
  const players = await readPlayers('kg');
  return runTransaction(db, async (tx) => {
    const vRef = doc(db, cfg.players, victimId);
    const vSnap = await tx.get(vRef);
    const v = vSnap.exists() ? vSnap.data() : null;
    if (!v || !v.dead) throw fail('alive', 'This player is not eliminated.');
    const killerId = v.killedBy || null;
    const next = v.targetId || null;                                       // the victim's own target at the moment of death
    const kRef = killerId ? doc(db, cfg.players, killerId) : null;
    const nRef = next ? doc(db, cfg.claims, next) : null;
    const [kSnap, nSnap, nPlayer] = await Promise.all([kRef ? tx.get(kRef) : null, nRef ? tx.get(nRef) : null, next ? tx.get(doc(db, cfg.players, next)) : null]);

    let nextOk = !!next && !(nPlayer?.exists() && nPlayer.data().dead);    // the old target must still be alive
    const revived = { dead: false, killedBy: null, killedAt: null, killUndo: null };

    if (kSnap) {
      const k = kSnap.exists() ? kSnap.data() : null;
      if (!k || k.dead) throw fail('moved', 'The hunter who killed this player is no longer in the game. Revive the hunter first.');
      const expected = next === killerId ? null : next;                    // what the hunter holds after inheriting
      if ((k.targetId || null) !== expected) throw fail('moved', `${nameOf(killerId)} has already moved on (another kill or a new target). If that was a mistake too, revive the later victim first.`);
      const u = v.killUndo;
      let item = u ? { itemText: u.itemText, itemOwnerId: u.itemOwnerId } : null;
      if (!u && v.itemText && k.itemOwnerId === v.itemOwnerId) {           // legacy: look for the item the hunter held before
        const prev = itemLocks.find((l) => l.byUserId === killerId && l.id !== v.itemOwnerId);
        const owner = prev && players.find((p) => p.id === prev.id);
        if (owner?.item) item = { itemText: owner.item, itemOwnerId: owner.id };
      }
      const patch = { targetId: victimId, targetName: nameOf(victimId), kills: u ? u.kills : Math.max(0, (k.kills || 1) - 1), ...(item || {}) };
      tx.update(kRef, patch);
      tx.set(doc(db, cfg.claims, victimId), { byUserId: killerId });       // the hunter hunts the victim again
      if (nextOk) { revived.targetId = next; revived.targetName = nameOf(next); tx.set(nRef, { byUserId: victimId }); }
      else Object.assign(revived, { targetId: null, targetName: null });
    } else {
      // removed by the admin without a hunter: take the old target back only if nobody else hunts them now
      if (nextOk && !nSnap.exists()) { revived.targetId = next; revived.targetName = nameOf(next); tx.set(nRef, { byUserId: victimId }); }
      else Object.assign(revived, { targetId: null, targetName: null });
    }
    tx.update(vRef, revived);
  });
}

// admin: eliminate somebody manually (contract goes to their hunter)
export async function adminEliminate(victimId, nameOf) {
  const players = await readPlayers('kg');
  const hunter = players.find((p) => !p.dead && p.targetId === victimId);
  return killPlayer(victimId, hunter ? hunter.id : null, nameOf);
}

/* ---------- admin: who plays which game ---------- */
export async function setPlays(game, userId, plays, nameOf) {
  const ref = doc(db, 'gameConfig', game);
  const cur = (await getDoc(ref)).data()?.excluded || [];
  const excluded = plays ? cur.filter((id) => id !== userId) : [...new Set([...cur, userId])];
  await setDoc(ref, { excluded });
  if (!plays) await detachUser(game, userId, nameOf);
}

/* A person leaves a game (switched off by the admin or removed from the leaderboard):
   keep every other contract valid. */
export async function detachUser(game, userId, nameOf) {
  const cfg = GAMES[game];
  if (game === 'kg') {
    const me = (await getDoc(doc(db, cfg.players, userId))).data();
    if (me && !me.dead) await adminEliminate(userId, nameOf);
    return;
  }
  const players = await readPlayers('sf');
  const batch = writeBatch(db);
  players.filter((p) => p.targetId === userId).forEach((p) => batch.update(doc(db, cfg.players, p.id), { targetId: null, targetName: null }));
  const mine = players.find((p) => p.id === userId);
  if (mine?.targetId) batch.delete(doc(db, cfg.claims, mine.targetId));
  batch.delete(doc(db, cfg.claims, userId));
  if (mine) batch.delete(doc(db, cfg.players, userId));
  await batch.commit();
}

/* ---------- admin: reset a game ---------- */
export async function resetGame(game) {
  const cfg = GAMES[game];
  for (const name of Object.values(cfg)) {
    const snap = await getDocs(collection(db, name));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}
