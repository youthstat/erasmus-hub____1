import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { countryOf } from '../../hooks/useGame.js';
import NamePicker from '../ui/NamePicker.jsx';
import PointsDelta from '../ui/PointsDelta.jsx';
import { useOscar } from '../../hooks/useOscar.js';
import ModalShell from './ModalShell.jsx';

const L = ({ t, children }) => <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">{t}{children}</label>;

function AuthForm({ next }) {
  const { users, registerAccount, loginAccount, closeModal, openMission } = useApp();
  const [tab, setTab] = useState('register');
  const [user, setUser] = useState(null);
  const [country, setCountry] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const options = users.filter((u) => (tab === 'register' ? !u.registered : u.registered));
  const switchTab = (k) => { setTab(k); setUser(null); setPw(''); setPw2(''); setMsg(''); };
  const pick = (o) => { setUser(o); setMsg(''); if (o && tab === 'register' && !country) setCountry(countryOf(o)); };

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return setMsg('Choose your name from the list first.');
    if (tab === 'register') {
      if (pw.length < 4) return setMsg('Password must have at least 4 characters.');
      if (pw !== pw2) return setMsg('The two passwords are different.');
    }
    setBusy(true); setMsg('');
    try {
      if (tab === 'register') await registerAccount({ userId: user.id, country: country.trim(), password: pw });
      else await loginAccount({ userId: user.id, password: pw });
      next ? openMission(next) : closeModal();
    } catch (err) { setMsg(err.message); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {[['register', 'Register'], ['login', 'Sign in']].map(([k, label]) => (
          <button type="button" key={k} onClick={() => switchTab(k)}
            className={`flex-1 border-[3px] border-ink rounded-xl px-3 py-2 font-mono text-sm font-bold uppercase ${tab === k ? 'bg-sun shadow-b4' : 'bg-white'}`}>{label}</button>
        ))}
      </div>
      <p className="text-sm text-[#4b4731]">
        {tab === 'register'
          ? 'First time here? Find your name in the list, add your country and create a password.'
          : 'Choose your name and enter the password you created.'}
      </p>
      <L t="Your name *"><NamePicker key={tab} options={options} value={user?.id} onChange={pick} /></L>
      {tab === 'register' && <L t="Country *"><input className="input" required maxLength={30} placeholder="e.g. Ukraine" value={country} onChange={(e) => setCountry(e.target.value)} /></L>}
      <L t={tab === 'register' ? 'Create password *' : 'Password *'}>
        <input className="input" type="password" required autoComplete={tab === 'register' ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} />
      </L>
      {tab === 'register' && <L t="Repeat password *"><input className="input" type="password" required autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></L>}
      {msg && <p className="font-mono text-sm font-bold text-hot">{msg}</p>}
      <button type="submit" disabled={busy} className="btn bg-neon w-full disabled:opacity-50">{busy ? '…' : tab === 'register' ? 'Register' : 'Sign in'}</button>
    </form>
  );
}

function Account() {
  const { profile, rank, users, myHistory, logoutAccount, closeModal } = useApp();
  const { myTeam, nameOf } = useOscar();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl md:text-3xl font-extrabold uppercase break-words">{profile.name}</div>
          <div className="font-mono text-sm text-mute">{countryOf(profile) || '—'}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold">{(profile.score ?? 0).toLocaleString('en-US')} <span className="text-base">PTS</span></div>
          <div className="font-mono text-xs font-bold text-mute">Rank #{rank} of {users.length}</div>
        </div>
      </div>
      {myTeam && (
        <div className="border-[3px] border-ink rounded-xl overflow-hidden">
          <div className="bg-sun border-b-[3px] border-ink px-4 py-2 font-mono text-xs font-bold uppercase">🎬 My film crew</div>
          <div className="p-4 flex flex-col gap-2">
            <div className="text-lg font-extrabold uppercase break-words">{myTeam.title}</div>
            <div className="font-mono text-xs"><b>Director:</b> {nameOf(myTeam.directorId)}</div>
            <div className="flex flex-wrap gap-2">
              {(myTeam.memberIds || []).map((u) => <span key={u} className={`tag ${u === myTeam.directorId ? 'bg-sun' : 'bg-white'}`}>{nameOf(u)}{u === profile.id ? ' (you)' : ''}</span>)}
            </div>
          </div>
        </div>
      )}
      <div className="border-[3px] border-ink rounded-xl overflow-hidden">
        <div className="bg-paper border-b-[3px] border-ink px-4 py-2 font-mono text-xs font-bold uppercase">Latest point changes</div>
        <ul className="divide-y-2 divide-ink/10 max-h-56 overflow-y-auto">
          {myHistory.map((l) => (
            <li key={l.id} className="px-4 py-2 flex justify-between gap-3 text-sm">
              <span>{l.reason}</span><PointsDelta change={l} />
            </li>
          ))}
          {myHistory.length === 0 && <li className="px-4 py-3 font-mono text-sm text-mute">No points yet. Complete a mission!</li>}
        </ul>
      </div>
      <div className="flex justify-between gap-3 pt-3 border-t-2 border-ink">
        <button className="btn bg-white" onClick={closeModal}>Close</button>
        <button className="btn bg-hot text-white" onClick={logoutAccount}>Log out</button>
      </div>
    </div>
  );
}

export default function AccountModal({ next }) {
  const { profile, closeModal } = useApp();
  return (
    <ModalShell title={profile ? 'My account' : 'Join the game'} onClose={closeModal} maxW="max-w-md">
      {profile ? <Account /> : <AuthForm next={next} />}
    </ModalShell>
  );
}
