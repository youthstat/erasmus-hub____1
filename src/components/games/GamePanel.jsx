import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as games from '../../firebase/games.js';
import { isJoined } from '../../firebase/games.js';
import { useGame } from '../../hooks/useGame.js';
import { useApp } from '../../context/AppContext.jsx';

// Secret friend: "about me" — what I like / do not like. My secret friend sees it when they draw me.
function WishesFields({ likes, dislikes, setLikes, setDislikes }) {
  return (
    <div className="border-[3px] border-ink rounded-xl bg-white p-4 flex flex-col gap-3">
      <p className="font-mono text-xs font-bold uppercase">About you — wishes for your secret friend</p>
      <p className="text-sm text-mute">Write what you like and what you do not. The person who gets your name will see it, so they can surprise you the right way.</p>
      <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">I like
        <textarea className="input !shadow-none" rows={2} maxLength={400} placeholder="tea, dark chocolate, origami, football…" value={likes} onChange={(e) => setLikes(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">I do not like / allergies
        <textarea className="input !shadow-none" rows={2} maxLength={400} placeholder="nuts, loud surprises, coffee…" value={dislikes} onChange={(e) => setDislikes(e.target.value)} />
      </label>
    </div>
  );
}

// shown instead of the form once the wishes have been sent with the join form
const WishesSent = () => (
  <p className="border-[3px] border-ink rounded-xl bg-white px-4 py-3 font-bold shadow-b2">✓ Your wishes have been sent. The person who gets your name will see them.</p>
);

const COPY = {
  sf: {
    title: 'Secret friend',
    joinBtn: 'Join the Secret friend game',
    joined: 'You are in the game! Now find out whose secret friend you are.',
    getBtn: 'Show me who I am secret friend of',
    resultLabel: 'You are the secret friend of',
    hint: 'This is the person you secretly take care of. Do not tell anyone. You can always come back here and see this name again.',
  },
  kg: {
    title: 'Killer game',
    joinBtn: 'Join the Killer game',
    joined: 'You are in the game! Now find out who your victim is and which object you get.',
    getBtn: 'Show me my victim and object',
    resultLabel: 'Your victim (the person you must trick) is',
    hint: 'Do not show this to anyone. You can always come back here and see your current victim and object again.',
  },
};

export default function GamePanel({ game }) {
  const c = COPY[game];
  const { profile, openAccount } = useApp();
  const { players, byId, playing, dead, nameOf, countryOfId } = useGame(game);
  const [item, setItem] = useState('');
  const [likes, setLikes] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [msg, setMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const me = profile ? byId.get(profile.id) : null;
  const enrolled = !!profile && playing.some((u) => u.id === profile.id);
  const joined = isJoined(me);
  const aliveCount = playing.filter((u) => !dead.has(u.id)).length;
  const joinedCount = players.filter(isJoined).length;

  const run = async (fn) => { setMsg(''); setBusy(true); try { await fn(); } catch (err) { setMsg(err.message); } setBusy(false); };
  const join = (e) => { e.preventDefault(); run(() => games.joinGame(game, profile.id, item, { likes, dislikes })); };
  const getName = () => run(async () => { await games.claimResult(game, profile.id, playing.map((u) => u.id), nameOf); setNotice(''); });
  const iKilled = () => {
    if (!confirm('Press OK only if you have really killed your victim (they touched the object and admitted it). Continue?')) return;
    run(async () => {
      const victim = nameOf(me.targetId);
      await games.killPlayer(me.targetId, profile.id, nameOf);
      setNotice(`${victim} is eliminated. Their contract is now yours — your next victim is shown below.`);
    });
  };
  const toBoard = () => document.getElementById('board')?.scrollIntoView({ behavior: 'smooth' });

  const Err = () => msg && <p className="font-mono text-sm font-bold text-hot">{msg}</p>;

  // who is this person? name + country, and where to look them up
  const WhoIs = () => (
    <div className="mt-1 font-mono text-sm font-bold">
      {countryOfId(me.targetId) && <span>from {countryOfId(me.targetId)}</span>}
      <div className="font-normal text-xs mt-1 opacity-90">
        Do not know them yet?{' '}
        {game === 'kg'
          ? <button type="button" className="underline font-bold" onClick={toBoard}>See all players below</button>
          : <Link to="/leaderboard" className="underline font-bold">See all participants</Link>}
      </div>
    </div>
  );

  return (
    <section className="box shadow-b8 overflow-hidden" id="play">
      <div className="bg-ink text-white px-4 py-3 font-mono font-bold uppercase flex flex-wrap justify-between gap-2">
        <span>{c.title} — {profile ? `playing as ${profile.name}` : 'sign in to play'}</span>
        <span className="text-sun">{joinedCount} / {playing.length} joined</span>
      </div>

      <div className="p-4 sm:p-6 bg-paper">
        {!profile && (
          <div className="max-w-xl flex flex-col gap-4">
            <p className="font-medium">To play you need your account. Sign in (or register once) — your name will be used automatically, nothing else to type.</p>
            <button className="btn bg-neon self-start" onClick={() => openAccount(null)}>Sign in / Register</button>
          </div>
        )}

        {profile && !enrolled && (
          <p className="font-mono text-sm">You are not enabled for this game. Ask the organizers to add you.</p>
        )}

        {/* killed */}
        {enrolled && game === 'kg' && me?.dead && (
          <div className="max-w-xl border-[3px] border-ink rounded-xl shadow-b6 p-6 bg-ink text-white">
            <div className="text-2xl sm:text-3xl font-extrabold uppercase line-through decoration-hot decoration-[5px] break-words">{profile.name}</div>
            <div className="mt-3 text-xl font-extrabold uppercase text-hot">You have been killed</div>
            <p className="mt-2 text-sm">Smile, admit defeat and congratulate your killer. Your contract and object have passed to them.</p>
          </div>
        )}

        {/* 1. join */}
        {enrolled && !me?.dead && !joined && (
          <form onSubmit={join} className="max-w-xl flex flex-col gap-4">
            <p className="font-medium">You are signed in as <b>{profile.name}</b>.</p>
            {game === 'kg' && (
              <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">Your object (safe everyday item)
                <input className="input" required maxLength={40} placeholder="pen, fork, apple, badge…" value={item} onChange={(e) => setItem(e.target.value)} />
                <span className="normal-case font-normal text-mute">This object will be given to ANOTHER player to “kill” their victim with — objects are mixed randomly, you will never get your own, and it has nothing to do with the victim’s name. No knives or dangerous things!</span>
              </label>
            )}
            {game === 'sf' && <WishesFields likes={likes} dislikes={dislikes} setLikes={setLikes} setDislikes={setDislikes} />}
            <Err />
            <button type="submit" disabled={busy} className="btn bg-neon self-start disabled:opacity-50">{busy ? '…' : c.joinBtn}</button>
          </form>
        )}

        {/* 2. joined, nothing drawn yet */}
        {enrolled && !me?.dead && joined && !me.targetId && !(game === 'kg' && aliveCount <= 1 && playing.length > 1) && (
          <div className="max-w-xl flex flex-col gap-4">
            <span className="tag bg-neon shadow-b4 -rotate-1 self-start text-sm px-4 py-1.5">✓ {profile.name}</span>
            <h3 className="text-xl sm:text-2xl font-extrabold uppercase">{c.joined}</h3>
            {notice && <p className="font-bold">{notice}</p>}
            {game === 'sf' && <WishesSent />}
            <Err />
            <button className="btn bg-sun self-start disabled:opacity-50" disabled={busy} onClick={getName}>{busy ? '…' : c.getBtn} →</button>
          </div>
        )}

        {/* last survivor */}
        {enrolled && game === 'kg' && !me?.dead && joined && !me.targetId && aliveCount <= 1 && playing.length > 1 && (
          <div className="max-w-xl border-[3px] border-ink rounded-xl shadow-b6 p-6 bg-sun">
            <div className="text-2xl font-extrabold uppercase">🏆 You are the last survivor</div>
            <p className="mt-2 font-bold">You are the Master Killer! Tell the organizers.</p>
          </div>
        )}

        {/* 3. result */}
        {enrolled && !me?.dead && joined && me.targetId && (
          <div className="max-w-xl flex flex-col gap-4">
            {notice && <p className="border-[3px] border-ink rounded-xl bg-neon px-4 py-3 font-bold shadow-b4">{notice}</p>}
            <div className={`border-[3px] border-ink rounded-xl shadow-b6 p-6 ${game === 'sf' ? 'bg-neon' : 'bg-hot text-white'}`}>
              <div className="font-mono text-xs font-bold uppercase">{c.resultLabel}</div>
              <div className="text-3xl sm:text-4xl font-extrabold uppercase break-words mt-1">★ {nameOf(me.targetId)} ★</div>
              <WhoIs />
              {game === 'sf' && (() => {
                const t = byId.get(me.targetId);
                return (
                  <div className="mt-4 pt-4 border-t-[3px] border-current flex flex-col gap-2">
                    <div className="font-mono text-xs font-bold uppercase">Wishes of {nameOf(me.targetId)}</div>
                    {t?.likes || t?.dislikes ? (
                      <div className="text-sm font-medium flex flex-col gap-1">
                        {t.likes && <div><b>Likes:</b> {t.likes}</div>}
                        {t.dislikes && <div><b>Does not like:</b> {t.dislikes}</div>}
                      </div>
                    ) : <div className="text-sm font-medium">{nameOf(me.targetId)} has not written any wishes yet. Check again later.</div>}
                  </div>
                );
              })()}
              {game === 'kg' && (
                <div className="mt-4 pt-4 border-t-[3px] border-current">
                  <div className="font-mono text-xs font-bold uppercase">Object to use on your victim</div>
                  <div className="text-2xl sm:text-3xl font-extrabold uppercase break-words">{me.itemText}</div>
                </div>
              )}
            </div>
            {game === 'kg' && (
              <div className="border-[3px] border-ink rounded-xl bg-white p-4 shadow-b4 flex flex-col gap-3">
                <p className="text-sm font-bold">⚠ Press this button ONLY after you have really killed your victim — they must have touched the object themselves and admitted it. After that you will see your next victim.</p>
                <Err />
                <button className="btn bg-hot text-white self-start disabled:opacity-50" disabled={busy} onClick={iKilled}>{busy ? '…' : 'I killed my victim'}</button>
              </div>
            )}
            <p className="text-sm font-medium">{c.hint}</p>
            {game === 'sf' && <WishesSent />}
          </div>
        )}
      </div>
    </section>
  );
}
