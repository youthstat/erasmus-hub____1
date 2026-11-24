import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfigured } from '../firebase/config.js';
import * as api from '../firebase/services.js';
import * as games from '../firebase/games.js';
import { SEED_MISSIONS } from '../data/missions.js';
import { ADMIN_PASSWORD } from '../config/settings.js';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
const today = () => new Date().toISOString().slice(0, 10);
const store = {
  get: () => { try { return localStorage.getItem('accountId'); } catch { return null; } },
  set: (v) => { try { v ? localStorage.setItem('accountId', v) : localStorage.removeItem('accountId'); } catch { /* ignore */ } },
};

export function AppProvider({ children }) {
  const [uid, setUid] = useState(null);                 // technical anonymous login (database access)
  const [accountId, setAccountId] = useState(store.get); // participant account (a document in `users`)
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('isAdmin') === '1');
  const [modal, setModal] = useState(null);
  const [missions, setMissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [pointsLog, setPointsLog] = useState([]);
  const [gossips, setGossips] = useState([]);
  const [homeHidden, setHomeHiddenState] = useState({});   // sections the admin switched off for participants
  const [homeReady, setHomeReady] = useState(false);
  const [error, setError] = useState('');

  // 1. анонімний вхід — лише технічний доступ до бази
  useEffect(() => {
    if (!firebaseConfigured) return;
    const off = onAuthStateChanged(auth, (u) => (u ? setUid(u.uid) : signInAnonymously(auth).catch((e) => setError(e.message))));
    return off;
  }, []);

  // 2. живі підписки
  useEffect(() => {
    if (!uid) return;
    const onErr = (e) => setError(e.message);
    const offs = [api.subscribeMissions(setMissions, onErr), api.subscribeUsers(setUsers, onErr), api.subscribePointsLog(setPointsLog, onErr),
      api.subscribeHomeConfig((h) => { setHomeHiddenState(h); setHomeReady(true); }, onErr)];
    if (isAdmin) { offs.push(api.subscribeAllSubmissions(setSubmissions, onErr)); offs.push(api.subscribeGossips(setGossips, onErr)); }
    else if (accountId) offs.push(api.subscribeMySubmissions(accountId, setSubmissions, onErr));
    else setSubmissions([]);
    if (!isAdmin) setGossips([]);
    return () => offs.forEach((o) => o());
  }, [uid, isAdmin, accountId]);

  const profile = useMemo(() => users.find((u) => u.id === accountId) || null, [users, accountId]);
  const rank = profile ? users.findIndex((u) => u.id === profile.id) + 1 : 0;
  const visibleMissions = useMemo(() => (isAdmin ? missions : missions.filter((m) => m.active !== false)), [missions, isAdmin]);
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  // last point change of every participant (shown next to the score) + own history
  const lastChange = useMemo(() => {
    const map = {};
    for (const l of pointsLog) if (!map[l.userId]) map[l.userId] = l;     // log is newest-first
    return map;
  }, [pointsLog]);
  const myHistory = useMemo(() => pointsLog.filter((l) => l.userId === accountId).slice(0, 15), [pointsLog, accountId]);

  const submissionIdFor = (m) => `${accountId}_${m.id}_${m.recurrence === 'DAILY' ? today() : 'once'}`;
  const statusFor = (m) => submissions.find((s) => s.id === submissionIdFor(m))?.status || null;

  // --- модальні вікна ---
  const openAuth = () => setModal({ type: 'auth' });
  const openMission = (mission) => setModal({ type: 'mission', mission });
  const openThanks = () => setModal({ type: 'thanks' });
  const openAccount = (next) => setModal({ type: 'account', next });
  const openEditor = (mission = null) => setModal({ type: 'editor', mission });
  const openUserEditor = (user = null) => setModal({ type: 'userEditor', user });
  const closeModal = () => setModal(null);

  // --- акаунт учасника (помилки кидаються в форму, а не в глобальний банер) ---
  const registerAccount = async ({ userId, country, password }) => {
    await api.registerAccount(userId, country, password);
    store.set(userId); setAccountId(userId);
  };
  const loginAccount = async ({ userId, password }) => {
    await api.checkPassword(userId, password);
    store.set(userId); setAccountId(userId);
  };
  const logoutAccount = () => { store.set(null); setAccountId(null); setModal(null); };

  // --- адмін ---
  const tryAdminLogin = (pw) => {
    if (pw !== ADMIN_PASSWORD) return false;
    sessionStorage.setItem('isAdmin', '1'); setIsAdmin(true); setModal(null); return true;
  };
  const logoutAdmin = () => { sessionStorage.removeItem('isAdmin'); setIsAdmin(false); };

  // --- дії ---
  const run = async (fn) => { try { await fn(); } catch (e) { setError(e.message); } };
  const actions = {
    sendGossip: (text, showName) => api.sendGossip({ id: accountId, name: profile?.name || '' }, text, showName),   // throws: the mascot shows the message itself
    submitMission: (m, proof) => run(() => api.sendSubmission(submissionIdFor(m), {
      missionId: m.id, missionTitle: m.title, points: Number(m.points), userId: accountId, userName: profile.name,
      proofType: proof.type, proofValue: proof.value })),
    clearGossips: () => run(() => api.clearGossips()),
    deleteGossip: (id) => run(() => api.deleteGossip(id)),
    clearSubmissions: (missionId) => run(() => api.clearSubmissions(missionId)),
    approve: (s) => run(() => api.approveSubmission(s)),
    reject: (id) => run(() => api.rejectSubmission(id)),
    adjustPoints: (userId, delta, reason) => run(() => api.adjustPoints(userId, delta, reason)),
    saveMission: (data, id) => run(() => api.saveMission(data, id)),
    deleteMission: (id) => run(() => api.removeMission(id)),
    saveUser: (data, id) => run(() => api.saveUser(data, id)),
    resetAccount: (id) => run(() => api.resetAccount(id)),
    // removing a person also keeps the games consistent (contracts pass on / links are freed)
    removeUser: (id) => run(async () => {
      const nameOf = (x) => users.find((u) => u.id === x)?.name || 'Unknown';
      await games.detachUser('sf', id, nameOf).catch(() => {});
      await games.detachUser('kg', id, nameOf).catch(() => {});
      await api.removeUser(id);
    }),
    setHomeHidden: (id, hidden) => run(() => api.setHomeHidden(id, hidden)),
    setAllHomeHidden: (ids, hidden) => run(() => api.setAllHomeHidden(ids, hidden)),
    seedMissions: () => run(() => Promise.all(SEED_MISSIONS.map((m) => api.saveMission(m)))),
  };

  return (
    <AppContext.Provider value={{
      uid, accountId, gossips, isAdmin, homeHidden, homeReady, modal, users, profile, rank, lastChange, myHistory, submissions, pendingCount,
      missions: visibleMissions, allMissions: missions,
      error, setError, firebaseConfigured, statusFor, openAuth, openMission, openThanks, openAccount, openEditor, openUserEditor,
      closeModal, tryAdminLogin, logoutAdmin, registerAccount, loginAccount, logoutAccount, ...actions,
    }}>
      {children}
    </AppContext.Provider>
  );
}
