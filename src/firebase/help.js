import { collection, doc, deleteDoc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './config.js';

/*
  helpTickets/{id}  questions / absence notices for the organizers (the admin page reads them)
    { caseNo, category, categoryTitle, anonymous, userId, userName (only when not anonymous), priority, location, text, contact,
      absence: { session, from, to, returnTime, reason, comment } | null, status: 'new' | 'done', createdAt }
  counters/help     { n }   -> sequential case numbers
*/
export const subscribeTickets = (cb, onErr) =>
  onSnapshot(query(collection(db, 'helpTickets'), orderBy('createdAt', 'desc'), limit(500)), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), onErr);

export async function createTicket(t) {
  const ref = doc(collection(db, 'helpTickets'));
  const cRef = doc(db, 'counters', 'help');
  let caseNo = 0;
  await runTransaction(db, async (tx) => {
    const c = await tx.get(cRef);
    caseNo = (c.exists() ? c.data().n || 0 : 0) + 1;
    tx.set(cRef, { n: caseNo });
    tx.set(ref, { ...t, caseNo, status: 'new', createdAt: serverTimestamp() });
  });
  return caseNo;
}
export const setTicketStatus = (id, status) => updateDoc(doc(db, 'helpTickets', id), { status });
export const removeTicket = (id) => deleteDoc(doc(db, 'helpTickets', id));
