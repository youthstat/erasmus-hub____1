import { useState } from 'react';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import { Banner, Card, List } from '../components/games/RulesBits.jsx';
import { useApp } from '../context/AppContext.jsx';
import { createTicket } from '../firebase/help.js';
import { CONTACTS, HELP_CATEGORIES, PRIORITIES, COMMON_RESOLUTIONS } from '../config/settings.js';

const L = ({ t, children }) => <label className="flex flex-col gap-1 font-mono text-xs font-bold uppercase">{t}{children}</label>;
const EMPTY = () => ({ reason: '', comment: '', priority: 'normal', location: '', text: '', contact: '' });

export default function HelpPage() {
  const { profile, openAccount } = useApp();
  const [catId, setCatId] = useState(HELP_CATEGORIES[0].id);
  const [anon, setAnon] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [f, setF] = useState(EMPTY);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);                       // case number

  const cat = HELP_CATEGORIES.find((c) => c.id === catId);
  const absence = cat.kind === 'absence';
  const mustName = absence;                                      // the organizers must know who is missing
  const anonymous = !mustName && anon;
  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setMsg(''); };

  const submit = async (e) => {
    e.preventDefault();
    const who = profile?.name || guestName.trim();
    if (!anonymous && !who) return setMsg('Write your name, or send the message anonymously.');
    const t = {
      category: cat.id, categoryTitle: cat.title, anonymous: anonymous,
      priority: absence ? 'normal' : f.priority, location: absence ? '' : f.location.trim(),
      text: absence ? f.reason.trim() : f.text.trim(), contact: anonymous ? '' : f.contact.trim(),
      absence: absence ? { reason: f.reason.trim(), comment: f.comment.trim() } : null,
    };
    if (!anonymous) Object.assign(t, { userId: profile?.id || null, userName: who });
    setBusy(true); setMsg('');
    try { setSent(await createTicket(t)); setF(EMPTY()); } catch (err) { setMsg(err.message); }
    setBusy(false);
  };

  return (
    <>
      <Marquee className="bg-hot text-white" items={['ASK THE TEAM', 'ORGANIZERS & FACILITATORS ARE ON CALL', `EMERGENCY: ${CONTACTS.emergencyNumber}`]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        <Header back />
        <Banner title="Ask the Team" cls="bg-cobalt text-white">
          A question, a problem or a notice for the organizers and facilitators — send it anonymously or with your name. If someone is in danger, call {CONTACTS.emergencyNumber} first.
        </Banner>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 box shadow-b8 overflow-hidden">
            <div className="bg-ink text-white px-4 py-3 font-mono font-bold uppercase">Message to the organizers</div>
            {sent ? (
              <div className="p-6 bg-neon flex flex-col gap-3 items-start">
                <div className="text-4xl">✅</div>
                <h2 className="text-2xl font-extrabold uppercase">Sent! Case #{sent}</h2>
                <p className="font-medium">The on-duty team has received your message and will react as soon as possible.</p>
                <button className="btn bg-white" onClick={() => setSent(null)}>Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} className="p-4 sm:p-6 bg-paper flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs font-bold uppercase">Category *</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {HELP_CATEGORIES.map((c) => (
                      <button type="button" key={c.id} onClick={() => { setCatId(c.id); setMsg(''); }}
                        className={`text-left border-[3px] border-ink rounded-xl px-3 py-2 font-mono text-sm font-bold ${catId === c.id ? 'bg-sun shadow-b4' : 'bg-white'}`}>{c.icon} {c.title}</button>
                    ))}
                  </div>
                </div>
                <p className="text-sm font-medium border-l-4 border-ink pl-3">{cat.hint}</p>

                {/* name / anonymous */}
                <div className="border-[3px] border-ink rounded-xl bg-white p-3 flex flex-col gap-2">
                  {mustName ? (
                    <p className="font-mono text-xs font-bold">For absence notices your name is required — the organizers need to know who is missing.</p>
                  ) : (
                    <div className="flex gap-2 font-mono text-xs font-bold uppercase">
                      <button type="button" onClick={() => setAnon(true)} className={`flex-1 border-[3px] border-ink rounded-lg px-2 py-2 ${anon ? 'bg-ink text-white' : 'bg-white'}`}>🔒 Anonymous</button>
                      <button type="button" onClick={() => setAnon(false)} className={`flex-1 border-[3px] border-ink rounded-lg px-2 py-2 ${!anon ? 'bg-ink text-white' : 'bg-white'}`}>👤 With my name</button>
                    </div>
                  )}
                  {!anonymous && (profile
                    ? <p className="font-mono text-xs">Sending as <b>{profile.name}</b></p>
                    : <div className="flex flex-col gap-2"><input className="input !py-2 !shadow-none" placeholder="Your name *" maxLength={60} value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                        <button type="button" className="font-mono text-xs underline text-left" onClick={() => openAccount(null)}>or sign in</button></div>)}
                  {anonymous && <p className="font-mono text-xs">No name or contact is stored with this message.</p>}
                </div>

                {absence ? (
                  <div className="flex flex-col gap-4">
                    <L t="Reason *"><textarea className="input" rows={3} required maxLength={400} placeholder="Why will you be late or absent?" value={f.reason} onChange={set('reason')} /></L>
                    <L t="Comment (optional)"><input className="input" maxLength={200} placeholder="e.g. I will join the next activity" value={f.comment} onChange={set('comment')} /></L>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <L t="Priority *"><select className="input" value={f.priority} onChange={set('priority')}>{PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></L>
                    <L t="Current location / room number (optional)"><input className="input" maxLength={60} value={f.location} onChange={set('location')} /></L>
                    <L t="Describe the situation *"><textarea className="input" rows={5} required maxLength={1000} value={f.text} onChange={set('text')} /></L>
                    {!anonymous && <L t="Contact (Telegram / WhatsApp) — optional"><input className="input" maxLength={60} value={f.contact} onChange={set('contact')} /></L>}
                  </div>
                )}

                {msg && <p className="font-mono text-sm font-bold text-hot">{msg}</p>}
                <button type="submit" disabled={busy} className="btn bg-hot text-white self-start disabled:opacity-50">{busy ? '…' : '🆘 Send to the organizers →'}</button>
              </form>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <Card title="Emergency contacts" cls="bg-white">
              <div><b>Duty coordinator (24/7)</b><br />{CONTACTS.dutyPhone}<br />Telegram: {CONTACTS.telegram}</div>
              <div><b>Medical room / first aid</b><br />{CONTACTS.medicalRoom}</div>
              <div><b>Info desk</b><br />{CONTACTS.infoDesk}</div>
              <div className="text-3xl font-extrabold text-hot">{CONTACTS.emergencyNumber}</div>
            </Card>
            <Card title="Common requests" cls="bg-sun"><List mark="✓" items={COMMON_RESOLUTIONS} /></Card>
          </aside>
        </section>
      </div>
    </>
  );
}
