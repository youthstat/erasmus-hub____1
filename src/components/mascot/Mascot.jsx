import { useEffect, useReducer, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { SPRITES } from './sprites.js';
import { countWords, pts } from '../../firebase/services.js';
import { GOSSIP_POINTS, GOSSIP_MIN_WORDS, MAX_GOSSIP_LENGTH } from '../../config/settings.js';

/*
  Rattie Patty lives ON the page. She climbs onto the blocks (boxes, cards), sits and sleeps on them,
  nibbles a corner, hides behind a block (only her head sticks out above its edge) and peeks in from the
  screen edge. From time to time she says "Don't click me!" (of course, everybody clicks).

  A click opens her talk panel (a white window): not signed in -> she asks to register; signed in -> she greets by name
  and proposes "a gossip for 1 point - deal?"  ->  Deal  ->  she waits for a gossip, the sender picks anonymous / with name. Send = +1 point at once (only if the gossip is longer than three words); a participant may
  send as many gossips as they like, every one must be new. Other participants never see them, only the admin
  page does (with the author's name only if the sender chose to show it).

  "Hiding" is done with a clip box whose bottom edge is the top edge of the block: the sprite is pushed
  down inside it (dive 0 = standing, 0.45 = peeking, 1 = hidden).
*/
const S = 0.38;                                  // sprite scale (small mouse)
const BOX_W = 54, BOX_H = 50, EDGE_W = 30;       // fixed box she lives in, so the position does not jump between poses
const SIT = ['idle', 'side', 'sit2', 'sit3', 'think'];
const RUN = ['run1', 'jump', 'run2', 'jump'];
const WARNING = "Don't click me! 🙈";
const THANKS = [
  'Mmm, delicious! 😻 Got more? Tell me something new, I love this!',
  'Ooh, juicy! 🤭 I’ll keep it safe. Another one? Something new!',
  'Wow, I did not know that! 👀 Come on, one more — something new!',
];
const SEL = '.box, [class*="border-[3px]"][class*="rounded-xl"]';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const vwidth = () => document.documentElement.clientWidth;

// blocks whose top edge is currently on screen
const visibleBlocks = () => [...document.querySelectorAll(SEL)].filter((el) => {
  if (el.closest('.fixed')) return false;       // modals / the talk panel
  const r = el.getBoundingClientRect();
  return r.width > 150 && r.height > 50 && r.top > 70 && r.top < innerHeight - 40;
});

// where (document coordinates) the box of a scene is
function place(sc) {
  if (!sc) return null;
  const sx = window.scrollX, sy = window.scrollY;
  if (sc.kind === 'edge') return { left: sx + (sc.side === 'l' ? 0 : vwidth() - EDGE_W), top: sc.y, cw: EDGE_W };
  if (!sc.el?.isConnected) return null;
  const r = sc.el.getBoundingClientRect();
  return { left: r.left + sx + sc.dx, top: r.top + sy + 3 - BOX_H, cw: BOX_W };
}

function build(act, el) {
  const r = el.getBoundingClientRect();
  const minDx = Math.max(4, 4 - r.left);
  const maxDx = Math.max(minDx, Math.min(r.width - BOX_W - 4, vwidth() - r.left - BOX_W - 4));
  const dx = rand(minDx, maxDx);
  const base = { kind: 'stand', act, el, dx, dive: 0, flip: pick([1, -1]) };
  switch (act) {
    case 'sleep': return { ...base, pose: 'sleep', extra: 'zzz' };
    case 'gnaw': return { ...base, pose: 'idle', extra: 'gnaw', flip: 1,    // nibbles the top-right corner of the block
      dx: clamp(r.width - BOX_W + 2, minDx, vwidth() - r.left - BOX_W - 2) };
    case 'peek': return { ...base, pose: pick(['alert', 'idle']), dive: 0.45 };
    case 'edge': {
      const side = pick(['l', 'r']);
      return { kind: 'edge', act, side, y: window.scrollY + rand(110, Math.max(130, innerHeight - 150)), pose: 'alert', dive: 0, flip: side === 'l' ? 1 : -1 };
    }
    default: return { ...base, pose: pick(SIT) };
  }
}

export default function Mascot() {
  const { profile, sendGossip, openAccount } = useApp();
  const { pathname } = useLocation();
  const [scene, setScene] = useState(null);
  const [frame, setFrame] = useState(0);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('hello');          // login | hello | write
  const [text, setText] = useState('');
  const [note, setNote] = useState(null);               // { kind: 'ok' | 'warn' | 'err', text }
  const [busy, setBusy] = useState(false);
  const [showName, setShowName] = useState(false);     // false = anonymous
  const [sent, setSent] = useState(0);                  // gossips sent in this panel (restarts the +5 animation)
  const [happy, setHappy] = useState(false);
  const [, relayout] = useReducer((n) => n + 1, 0);
  const ref = useRef(null);
  const show = (sc) => { ref.current = sc; setScene(sc); };

  // blocks move when the window is resized or content loads -> re-read their positions
  useEffect(() => {
    window.addEventListener('resize', relayout);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(relayout) : null;
    ro?.observe(document.body);
    return () => { window.removeEventListener('resize', relayout); ro?.disconnect(); };
  }, []);

  // running frames
  useEffect(() => {
    if (!scene?.walking) return;
    const i = setInterval(() => setFrame((f) => f + 1), 120);
    return () => clearInterval(i);
  }, [scene?.walking]);

  // the life of the mouse
  useEffect(() => {
    if (open) return;
    let dead = false;
    show(null);
    const wait = (ms) => new Promise((res) => setTimeout(() => res(!dead), ms));
    const patch = (o) => { if (ref.current) show({ ...ref.current, ...o }); };

    // hide behind the current block, reappear (rise) at the next place
    const reveal = async (next) => {
      if (ref.current) { patch({ dive: 1, walking: false, say: null, extra: null }); if (!(await wait(500))) return false; }
      show({ ...next, dive: 1, instant: true });
      if (!(await wait(80))) return false;
      show({ ...next, instant: false });
      return wait(550);
    };
    // run over the blocks to the next place
    const walk = async (next) => {
      const a = place(ref.current), b = place(next);
      const ms = clamp(350 + Math.hypot(b.left - a.left, b.top - a.top) * 3, 500, 2200);
      const flip = b.left >= a.left ? 1 : -1;
      show({ ...next, dive: 0, walking: true, flip, ms, extra: null, pose: 'run1' });
      if (!(await wait(ms))) return false;
      show({ ...next, flip: next.act === 'gnaw' ? 1 : flip, walking: false });
      return true;
    };
    const gossip = async (ms) => {
      if (!(await wait(900))) return false;
      patch({ say: WARNING });
      if (!(await wait(2600))) return false;
      patch({ say: null });
      return wait(ms);
    };

    (async () => {
      if (!(await wait(1500))) return;
      if (reduced()) { const l = visibleBlocks(); if (l[0]) show(build('sit', l[0])); return; }
      while (!dead) {
        const list = visibleBlocks();
        if (!list.length) { if (!(await wait(2500))) return; continue; }
        const others = list.filter((b) => b !== ref.current?.el);
        const act = pick(['sit', 'sit', 'sleep', 'gnaw', 'peek', 'peek', 'edge']);
        const next = build(act, pick(others.length ? others : list));
        const cur = ref.current;
        const smooth = cur && place(cur) && cur.kind === 'stand' && cur.dive === 0 && next.kind === 'stand' && next.dive === 0;
        if (!(await (smooth ? walk(next) : reveal(next)))) return;

        let ok = true;
        if (act === 'sleep') ok = await wait(rand(7000, 10000));
        else if (act === 'gnaw') ok = await wait(rand(5000, 7000));
        else if (Math.random() < 0.5) ok = await gossip(800);
        else ok = await wait(rand(3500, 5500));
        if (!ok) return;
      }
    })();
    return () => { dead = true; };
  }, [open, pathname]);

  const onClick = () => {
    setText(''); setNote(null); setHappy(false); setSent(0); setShowName(false);
    setPhase(profile ? 'hello' : 'login');
    setOpen(true);
  };
  const close = () => { setOpen(false); setPhase('hello'); setText(''); setNote(null); setHappy(false); };

  const submit = async () => {
    if (busy) return;
    if (countWords(text) < GOSSIP_MIN_WORDS)
      return setNote({ kind: 'warn', text: `Hmm, that’s too short! Tell me more than ${GOSSIP_MIN_WORDS - 1} words and I’ll pay you ${pts(GOSSIP_POINTS)}.` });
    setBusy(true);
    try {
      await sendGossip(text, showName);
      setText(''); setSent((n) => n + 1); setHappy(true);
      setNote({ kind: 'ok', text: THANKS[sent % THANKS.length] });
      setTimeout(() => setHappy(false), 2600);
    } catch (e) {
      if (e.code === 'duplicate') setNote({ kind: 'warn', text: 'I already know this one! 😼 Tell me something new.' });
      else if (e.code === 'short') setNote({ kind: 'warn', text: 'Tell me a bit more!' });
      else setNote({ kind: 'err', text: e.message || 'Something went wrong.' });
    } finally { setBusy(false); }
  };

  /* ---------- talk panel (after a click) ---------- */
  if (open) {
    const writing = phase === 'write';
    const pose = writing ? (happy ? 'thanks' : text.trim() ? 'secret' : 'wait') : phase === 'login' ? 'love' : 'hello';
    const s = SPRITES[pose];
    const k = writing ? 0.6 : 0.7;
    const words = countWords(text);
    return (
      <div className="fixed z-[60] right-2 bottom-2 sm:right-6 sm:bottom-4 flex items-end gap-1 sm:gap-2 max-w-[calc(100vw-1rem)]">
        <div className={`mascot-pop mascot-panel relative min-w-0 mb-6 border-[3px] border-ink rounded-xl shadow-b6 ${writing ? 'w-[250px] sm:w-[330px]' : 'w-[210px] sm:w-[270px]'}`}>
          <div className="flex items-center justify-between gap-2 px-1 pt-1 border-b-[3px] border-ink bg-paper rounded-t-lg">
            {writing
              ? <span className="border-2 border-b-0 border-ink bg-sun rounded-t px-2 py-0.5 font-mono text-[11px] font-bold uppercase max-w-[75%] truncate">{showName ? `👤 ${profile?.name || 'You'}` : '🔒 Anonymous'}</span>
              : <span />}
            <button onClick={close} aria-label="Close" className="w-6 h-6 mb-1 border-2 border-ink bg-white font-bold leading-none">✕</button>
          </div>
          <div className="relative z-10 p-3 sm:p-4 flex flex-col gap-2 text-sm sm:text-base font-bold">
            {phase === 'login' && (<>
              <p>Hi, I’m Rattie Patty! <span className="text-hot">❤</span></p>
              <p className="font-medium">I don’t see who you are yet 🧐 Please register (or sign in) — then I’ll know your name and can pay you points!</p>
              <button className="btn bg-neon text-xs" onClick={() => { close(); openAccount(null); }}>Register / Sign in</button>
            </>)}

            {phase === 'hello' && (<>
              <p>Hi, I’m Rattie Patty! <span className="text-hot">❤</span></p>
              <p className="font-medium">Nice to meet you, <b className="break-words">{profile?.name}</b>! 🧀</p>
              <p className="font-medium">I can give you <span className="text-xl text-[#c4263f]">{GOSSIP_POINTS}</span> {GOSSIP_POINTS === 1 ? 'point' : 'points'} if you give me a <b>gossip</b>. Deal?</p>
              <div className="flex gap-2 pt-1">
                <button className="btn bg-neon text-xs flex-1" onClick={() => setPhase('write')}>Deal!</button>
                <button className="btn bg-white text-xs flex-1" onClick={close}>No way</button>
              </div>
            </>)}

            {writing && (<>
              <p className="font-medium">{note ? <span className={note.kind === 'ok' ? 'text-[#007a33] font-bold' : note.kind === 'err' ? 'text-hot font-mono text-xs' : 'text-[#c4263f] font-bold'}>{note.text}</span>
                : <>I’m all ears… tell me a juicy gossip! 👂</>}</p>
              <textarea autoFocus rows={4} maxLength={MAX_GOSSIP_LENGTH} value={text} disabled={busy}
                onChange={(e) => { setText(e.target.value); if (note?.kind !== 'ok') setNote(null); }}
                onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && submit()}
                placeholder="Write your gossip here…"
                className="w-full resize-none border-[3px] border-ink rounded-xl px-3 py-2 font-sans text-sm font-medium bg-white focus:outline-none focus:bg-sun/20" />
              <div className="flex border-[3px] border-ink rounded-xl overflow-hidden font-mono text-[11px] font-bold uppercase" role="radiogroup" aria-label="Who is the gossip from">
                <button type="button" role="radio" aria-checked={!showName} onClick={() => setShowName(false)} className={`flex-1 px-2 py-1.5 ${!showName ? 'bg-ink text-white' : 'bg-white'}`}>🔒 Anonymous</button>
                <button type="button" role="radio" aria-checked={showName} onClick={() => setShowName(true)} className={`flex-1 px-2 py-1.5 border-l-[3px] border-ink min-w-0 truncate ${showName ? 'bg-ink text-white' : 'bg-white'}`}>👤 Show my name</button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={`font-mono text-[11px] font-normal ${words >= GOSSIP_MIN_WORDS ? 'text-[#007a33]' : 'text-mute'}`}>{words} {words === 1 ? 'word' : 'words'} · {GOSSIP_MIN_WORDS}+ = {GOSSIP_POINTS} pt</span>
                <button className="btn bg-neon text-xs py-1.5" disabled={busy} onClick={submit}>{busy ? '…' : 'Send'}</button>
              </div>
              <p className="font-mono text-[11px] font-normal text-mute leading-snug">
                🤫 <b className="font-bold text-ink">I know how to keep secrets!</b>{' '}
                {showName
                  ? `Other participants never see your gossip. Only the organizers can read it, with your name (${profile?.name || 'you'}).`
                  : 'Your gossip is anonymous: other participants never see it, and nobody will know it was you.'}
              </p>
            </>)}
          </div>
          <span className="absolute -right-2 bottom-5 w-4 h-4 rotate-45 bg-white border-r-[3px] border-t-[3px] border-ink" />
        </div>
        <div className="relative shrink-0">
          {happy && <span key={sent} className="mascot-float absolute left-1/2 -top-2 -translate-x-1/2 border-2 border-ink bg-neon rounded px-2 py-0.5 font-mono font-bold text-sm shadow-b2">+{GOSSIP_POINTS}</span>}
          <img src={s.src} alt="" draggable={false} style={{ width: s.w * k, height: s.h * k }} />
        </div>
      </div>
    );
  }

  /* ---------- roaming on the page ---------- */
  const p = place(scene);
  if (!scene || !p) return null;
  const pose = scene.walking ? RUN[frame % RUN.length] : scene.pose;
  const sp = SPRITES[pose];
  const w = sp.w * S, h = sp.h * S;
  const edge = scene.kind === 'edge';
  const ty = edge ? 0 : scene.dive * BOX_H;
  const tx = !edge ? 0 : scene.side === 'l' ? -(w - EDGE_W) - EDGE_W * scene.dive : EDGE_W * scene.dive;
  const anim = scene.walking ? 'mascot-hop' : scene.extra === 'gnaw' ? 'mascot-nibble' : !edge && (pose === 'idle' || pose === 'alert') && !scene.dive ? 'mascot-breathe' : '';
  const bubbleRight = p.left > vwidth() * 0.55;

  return (
    <div className="absolute left-0 top-0 w-full h-0 z-40 pointer-events-none" style={{ overflowX: 'clip' }}>
      <div role="button" tabIndex={0} title="Don’t click me!" aria-label="Rattie Patty — please don’t click"
        onClick={onClick} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
        className="absolute cursor-pointer focus:outline-none"
        style={{
          left: p.left, top: p.top, width: p.cw, height: BOX_H,
          pointerEvents: scene.dive >= 0.95 ? 'none' : 'auto',
          transition: scene.instant ? 'none' : scene.walking ? `left ${scene.ms}ms linear, top ${scene.ms}ms linear` : 'none',
        }}>
        <div className={anim}>
          <div style={{ width: p.cw, height: BOX_H, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: edge ? 'flex-start' : 'center' }}>
            <img src={sp.src} alt="" draggable={false}
              style={{ width: w, height: h, flexShrink: 0, userSelect: 'none', transform: `translate(${tx}px, ${ty}px) scaleX(${scene.flip})`, transition: 'transform .45s ease' }} />
          </div>
        </div>

        {scene.say && (
          <span className="mascot-pop absolute whitespace-nowrap border-2 border-ink bg-white rounded px-2 py-1 font-mono text-[11px] font-bold shadow-b2"
            style={{ bottom: `calc(100% - ${Math.round(ty)}px + 4px)`, ...(bubbleRight ? { right: 0 } : { left: 0 }) }}>{WARNING}</span>
        )}
        {scene.extra === 'zzz' && !scene.walking && scene.dive < 0.5 && (<>
          <span className="mascot-zzz absolute font-mono font-bold text-[11px]" style={{ right: -2, top: 8 }}>z</span>
          <span className="mascot-zzz absolute font-mono font-bold text-[9px]" style={{ right: -9, top: 2, animationDelay: '.8s' }}>z</span>
        </>)}
        {scene.extra === 'gnaw' && !scene.walking && [0, 1, 2].map((i) => (
          <span key={i} className="mascot-crumb absolute w-1 h-1 bg-ink" style={{ left: BOX_W - 3 + i * 3, top: BOX_H - 12, animationDelay: `${i * 0.3}s`, '--dx': `${4 + i * 3}px` }} />
        ))}
      </div>
    </div>
  );
}
