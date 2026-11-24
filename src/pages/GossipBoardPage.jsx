import { useEffect, useState } from 'react';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import { MAX_GOSSIP_LENGTH } from '../config/settings.js';
import { Banner } from '../components/games/RulesBits.jsx';
import { useApp } from '../context/AppContext.jsx';
import { subscribeGossipAccess, gossipPasswordOk, subscribeGossips, sendBoardGossip } from '../firebase/services.js';

const when = (g) => g.createdAt?.toDate?.().toLocaleDateString([], { day: '2-digit', month: 'short' }) || 'just now';
const KEY = 'gossipUnlock';
const saved = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
const save = (v) => { try { sessionStorage.setItem(KEY, v); } catch { /* ignore */ } };


// Anyone can write here, even while the board is closed for reading. Anonymous: no author is stored.
function WhisperForm() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await sendBoardGossip(text); setText(''); setDone(true); } catch (err) { setMsg(err.message); }
    setBusy(false);
  };
  if (done) return (
    <div className="box shadow-b8 p-6 bg-neon flex flex-col gap-3 items-start">
      <div className="text-4xl">🐭</div>
      <h2 className="text-2xl font-extrabold uppercase">Thank you for the gossip!</h2>
      <p className="font-medium">Rattie Patty keeps it safe. Nobody will know it was you.</p>
      <button className="btn bg-white" onClick={() => setDone(false)}>Write another</button>
    </div>
  );
  return (
    <form onSubmit={submit} className="box shadow-b8 overflow-hidden">
      <div className="bg-ink text-white px-4 py-3 font-mono font-bold uppercase">Write a gossip · anonymous</div>
      <div className="p-4 sm:p-6 bg-paper flex flex-col gap-3">
        <p className="text-sm font-medium">You cannot read the board yet, but you can always add to it. Nothing is saved about who you are.</p>
        <textarea className="input" rows={4} maxLength={MAX_GOSSIP_LENGTH} placeholder="What have you heard?" value={text} onChange={(e) => { setText(e.target.value); setMsg(''); }} />
        {msg && <p className="font-mono text-sm font-bold text-hot">{msg}</p>}
        <button className="btn bg-sun self-start disabled:opacity-50" disabled={busy || text.trim().length < 3}>Send anonymously</button>
      </div>
    </form>
  );
}

// Read-only gossip board. It exists only while the admin has opened it, and only with the password the admin set.
export default function GossipBoardPage() {
  const { isAdmin, setError } = useApp();
  const [access, setAccess] = useState(null);         // null = loading
  const [pw, setPw] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [msg, setMsg] = useState('');
  const [list, setList] = useState([]);

  useEffect(() => subscribeGossipAccess(setAccess, (e) => setError(e.message)), [setError]);

  // an earlier unlock counts only while the admin keeps the same password
  useEffect(() => { setUnlocked(!!access?.open && !!access.passHash && saved() === access.passHash); }, [access]);
  const canRead = isAdmin || (access?.open && unlocked);
  useEffect(() => (canRead ? subscribeGossips(setList, (e) => setError(e.message)) : undefined), [canRead, setError]);

  const unlock = async (e) => {
    e.preventDefault(); setMsg('');
    if (await gossipPasswordOk(pw, access)) { save(access.passHash); setUnlocked(true); setPw(''); }
    else setMsg('Wrong password.');
  };

  return (
    <>
      <Marquee className="bg-ink text-white" items={['RATTIE PATTY WHISPERS', 'READ-ONLY GOSSIP BOARD', 'AUTHORS STAY SECRET']} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <Header back />
        <Banner title="Gossip board" cls="bg-neon">What Rattie Patty has heard. Read-only — the authors are never shown.</Banner>

        <WhisperForm />

        {access === null && <div className="box p-6 font-mono">Loading…</div>}

        {access && !access.open && !isAdmin && (
          <div className="box p-6"><p className="font-bold">🔒 The Gossip board is closed.</p><p className="mt-1 text-sm">The organizers open it later and give a password to those who may read it.</p></div>
        )}

        {access?.open && !canRead && (
          <form onSubmit={unlock} className="box shadow-b8 p-6 flex flex-col gap-3 max-w-md">
            <p className="font-bold">The board is open for those who have the password from the organizers.</p>
            <input className="input" type="password" autoFocus placeholder="Password" value={pw} onChange={(e) => { setPw(e.target.value); setMsg(''); }} />
            {msg && <p className="font-mono text-sm font-bold text-hot">{msg}</p>}
            <button className="btn bg-neon self-start" disabled={!pw}>Open the board</button>
          </form>
        )}

        {isAdmin && !access?.open && <div className="border-[3px] border-ink rounded-xl bg-sun px-4 py-3 font-mono text-sm font-bold">Admin preview — the board is closed for participants. Open it in Admin panel → Gossips.</div>}

        {canRead && (
          <section className="flex flex-col gap-3">
            <div className="font-mono text-xs font-bold uppercase">{list.length} gossips · read-only</div>
            {list.map((g) => (
              <article key={g.id} className="border-[3px] border-ink rounded-xl bg-white shadow-b4 p-4">
                <p className="whitespace-pre-line break-words">“{g.text}”</p>
                <div className="mt-2 font-mono text-xs text-mute">{when(g)}</div>
              </article>
            ))}
            {list.length === 0 && <div className="box p-6 font-mono text-sm">No gossips yet.</div>}
          </section>
        )}
      </div>
    </>
  );
}
