import { useEffect, useRef, useState } from 'react';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import { Banner } from '../components/games/RulesBits.jsx';
import PunishmentBoxArt from '../components/punishment/PunishmentBoxArt.jsx';
import { useApp } from '../context/AppContext.jsx';
import { subscribePunishments, writePunishment, drawPunishment } from '../firebase/punishment.js';
import { PUNISHMENT_COST, PUNISHMENT_REWARD, PUNISHMENT_MAX_LENGTH, PUNISHMENT_MIN_LENGTH } from '../config/settings.js';

// The unfolded paper with the punishment (like the last frame of the storyboard)
function Note({ text }) {
  const size = text.length > 120 ? 'text-lg' : text.length > 60 ? 'text-xl' : 'text-2xl sm:text-3xl';
  return (
    <div className="note-unfold relative w-full max-w-lg mx-auto bg-[#fbf8f1] border-[3px] border-ink rounded-md shadow-b6">
      <div className="absolute inset-2 border-2 border-ink/40 rounded-sm pointer-events-none" />
      <div className="absolute inset-y-2 left-1/2 border-l-2 border-ink/15 pointer-events-none" />
      <div className="absolute inset-x-2 top-1/2 border-t-2 border-ink/10 pointer-events-none" />
      <div className="relative px-8 py-10 min-h-[11rem] flex items-center justify-center text-center">
        <p className={`${size} font-extrabold uppercase leading-snug break-words -rotate-1`}>{text}</p>
      </div>
    </div>
  );
}

export default function PunishmentPage() {
  const { profile, openAccount } = useApp();
  const [papers, setPapers] = useState([]);
  const [text, setText] = useState('');
  const [fold, setFold] = useState(false);               // the writing paper folds up
  const [lid, setLid] = useState(0);
  const [flight, setFlight] = useState(null);
  const [flightKey, setFlightKey] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [thud, setThud] = useState(0);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState(false);
  const [note, setNote] = useState(null);                // { id, text } the paper that is open now
  const [msg, setMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const timers = useRef([]);
  const noteRef = useRef(null);
  const { setError } = useApp();

  useEffect(() => subscribePunishments(setPapers, (e) => setError(e.message)), [setError]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (ms, fn) => { timers.current.push(setTimeout(fn, ms)); };

  const inBox = papers.filter((p) => !p.drawn).length;
  const mine = profile ? papers.filter((p) => p.userId === profile.id).length : 0;
  const taken = profile ? papers.filter((p) => p.drawnBy === profile.id).sort((a, b) => (b.drawnAt?.seconds || 0) - (a.drawnAt?.seconds || 0)) : [];
  const score = profile?.score ?? 0;

  const openLid = (t0 = 0) => { later(t0, () => setLid(1)); later(t0 + 110, () => setLid(2)); later(t0 + 220, () => setLid(3)); return t0 + 330; };
  const closeLid = (t0 = 0) => {
    later(t0, () => setLid(2)); later(t0 + 110, () => setLid(1)); later(t0 + 220, () => { setLid(0); setPulse((p) => p + 1); setThud((t) => t + 1); });
    return t0 + 330;
  };

  /* ---- write: the paper folds, flies into the box, the lid closes ---- */
  const write = async (e) => {
    e.preventDefault();
    if (!profile) return openAccount(null);
    setMsg(''); setOkMsg('');
    if (text.trim().length < PUNISHMENT_MIN_LENGTH) return setMsg(`Write at least ${PUNISHMENT_MIN_LENGTH} characters.`);
    setBusy(true);
    try { await writePunishment(profile, text); } catch (err) { setMsg(err.message); setBusy(false); return; }
    setFold(true);
    later(800, () => { setFold(false); setText(''); });
    const t = openLid(500);
    later(t, () => { setFlight('in'); setFlightKey((k) => k + 1); });
    later(t + 950, () => setFlight(null));
    const end = closeLid(t + 950);
    later(end + 150, () => { setBusy(false); setOkMsg(`Thrown into the box! +${PUNISHMENT_REWARD} point added to your rating.`); });
  };

  /* ---- draw: warning first, then the lid opens and one paper comes out and unfolds ---- */
  const askDraw = () => {
    setMsg(''); setOkMsg('');
    if (!profile) return openAccount(null);
    if (busy) return;
    if (!inBox) return setMsg('The box is empty. Write the first punishment!');
    setWarn(true);
  };
  const confirmDraw = async () => {
    setWarn(false); setBusy(true); setNote(null);
    let got;
    try { got = await drawPunishment(profile); } catch (err) { setMsg(err.message); setBusy(false); return; }
    const t = openLid(0);
    later(t, () => { setFlight('out'); setFlightKey((k) => k + 1); });
    later(t + 900, () => { setFlight(null); setNote(got); setBusy(false); setTimeout(() => noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80); });
  };
  const closeNote = (then) => {
    setNote(null); setBusy(true);
    const end = closeLid(0);
    later(end + 150, () => { setBusy(false); if (then) then(); });
  };

  return (
    <>
      <Marquee className="bg-hot text-white" items={['PUNISHMENT BOX', 'WRITE · THROW · DRAW', `EVERY DRAW COSTS ${PUNISHMENT_COST} POINTS`]} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        <Header back />
        <Banner title="Punishment box" cls="bg-ink text-white">
          Write a punishment on a paper and throw it into the box. Dare to press the box — and you will pull out a paper written by somebody else.
        </Banner>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border-[3px] border-ink rounded-xl shadow-b4 bg-neon p-4"><div className="font-mono text-xs font-bold uppercase">Write one</div><div className="text-3xl font-extrabold">+{PUNISHMENT_REWARD} PT</div><div className="font-mono text-xs">for every punishment you throw in</div></div>
          <div className="border-[3px] border-ink rounded-xl shadow-b4 bg-hot text-white p-4"><div className="font-mono text-xs font-bold uppercase">Draw one</div><div className="text-3xl font-extrabold">−{PUNISHMENT_COST} PTS</div><div className="font-mono text-xs">for every paper you take out</div></div>
          <div className="border-[3px] border-ink rounded-xl shadow-b4 bg-white p-4"><div className="font-mono text-xs font-bold uppercase">Anonymous</div><div className="text-3xl font-extrabold">Nobody knows</div><div className="font-mono text-xs">who wrote which paper</div></div>
        </section>

        {!profile && (
          <div className="box p-6 flex flex-col gap-3 items-start">
            <p className="font-medium">Sign in to write punishments and to draw them — your rating is changed automatically.</p>
            <button className="btn bg-neon" onClick={() => openAccount(null)}>Sign in / Register</button>
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* write */}
          <form onSubmit={write} className="flex flex-col gap-3">
            <h2 className="text-2xl font-extrabold uppercase">1 · Write a punishment</h2>
            <div className={`relative bg-[#fbf8f1] border-[3px] border-ink rounded-md shadow-b6 p-4 -rotate-1 origin-center ${fold ? 'note-fold' : ''}`}>
              <div className="absolute inset-2 border-2 border-ink/30 rounded-sm pointer-events-none" />
              <textarea className="relative w-full bg-transparent font-extrabold uppercase text-lg leading-snug resize-none focus:outline-none placeholder:text-ink/30 p-3"
                rows={5} maxLength={PUNISHMENT_MAX_LENGTH} disabled={busy || !profile} value={text}
                placeholder="e.g. Sing the chorus of any song in the middle of the room"
                onChange={(e) => { setText(e.target.value); setMsg(''); setOkMsg(''); }} />
              <div className="relative text-right font-mono text-[11px] text-mute px-3">{text.length} / {PUNISHMENT_MAX_LENGTH}</div>
            </div>
            <p className="text-sm font-medium">Keep it funny and kind: something that can be done right here, in front of everybody. No humiliation, nothing dangerous.</p>
            {msg && <p className="font-mono text-sm font-bold text-hot">{msg}</p>}
            {okMsg && <p className="border-[3px] border-ink rounded-xl bg-neon px-4 py-3 font-bold shadow-b4">✓ {okMsg}</p>}
            <button type="submit" disabled={busy || !profile || !text.trim()} className="btn bg-neon self-start disabled:opacity-50">📝 Fold &amp; throw into the box (+{PUNISHMENT_REWARD})</button>
            {profile && <p className="font-mono text-xs text-mute">You have written {mine} {mine === 1 ? 'punishment' : 'punishments'} so far.</p>}
          </form>

          {/* box */}
          <div className="flex flex-col gap-3 items-stretch">
            <h2 className="text-2xl font-extrabold uppercase">2 · Draw a punishment</h2>
            <div key={thud} className={thud ? 'pb-thud' : ''}>
              <PunishmentBoxArt lid={lid} flight={flight} flightKey={flightKey} pulse={pulse} onClick={askDraw} disabled={busy} />
            </div>
            <div className="text-center font-mono text-sm font-bold">{inBox} {inBox === 1 ? 'paper' : 'papers'} in the box</div>
            <button className="btn bg-hot text-white self-center disabled:opacity-50" disabled={busy || (!!profile && !inBox)} onClick={askDraw}>
              🎲 Get a punishment (−{PUNISHMENT_COST} PTS)
            </button>
            <p className="text-center text-xs text-mute font-mono">You can also press the box itself.</p>
          </div>
        </section>

        {/* the open paper */}
        {note && (
          <section ref={noteRef} className="flex flex-col gap-4 items-center">
            <div className="font-mono text-xs font-bold uppercase text-hot">Your punishment</div>
            <Note text={note.text} />
            <div className="flex flex-wrap justify-center gap-3">
              <button className="btn bg-white" disabled={busy} onClick={() => closeNote()}>Close the paper</button>
              <button className="btn bg-hot text-white" disabled={busy} onClick={() => closeNote(() => setWarn(true))}>Take another (−{PUNISHMENT_COST} PTS)</button>
            </div>
          </section>
        )}

        {profile && taken.length > 0 && (
          <section className="box overflow-hidden">
            <div className="bg-paper border-b-[3px] border-ink px-4 py-3 font-mono font-bold uppercase">Punishments you have drawn · {taken.length}</div>
            <ul className="divide-y-2 divide-ink/15">
              {taken.map((p) => <li key={p.id} className="px-4 py-3 font-bold uppercase text-sm break-words">{p.text}</li>)}
            </ul>
          </section>
        )}
      </div>
      <Marquee className="bg-sun text-ink" items={['WRITE SOMETHING FUNNY', 'ONE PAPER AT A TIME', 'FACE YOUR PUNISHMENT']} />

      {/* big red warning */}
      {warn && (
        <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4" onClick={() => setWarn(false)}>
          <div className="max-w-lg w-full border-4 border-ink rounded-2xl bg-hot text-white shadow-b8 p-6 sm:p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-6xl" aria-hidden="true">⚠️</div>
            <h2 className="text-4xl sm:text-5xl font-extrabold uppercase leading-none mt-2">Warning!</h2>
            <p className="text-3xl sm:text-4xl font-extrabold uppercase mt-3">−{PUNISHMENT_COST} points</p>
            <p className="mt-3 text-lg font-bold">Taking a punishment takes {PUNISHMENT_COST} points from your rating. You pay even if you do not like the paper. This cannot be undone.</p>
            <p className="mt-2 font-mono text-sm font-bold">Your rating: {score} → {score - PUNISHMENT_COST} PTS</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button className="btn bg-white text-ink" onClick={() => setWarn(false)}>Cancel</button>
              <button className="btn bg-ink text-white" onClick={confirmDraw}>I understand — take it (−{PUNISHMENT_COST})</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
