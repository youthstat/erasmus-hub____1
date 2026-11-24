import { useState } from 'react';
import { Link } from 'react-router-dom';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import { Banner } from '../components/games/RulesBits.jsx';
import TeamModal from '../components/oscar/TeamModal.jsx';
import NominateModal from '../components/oscar/NominateModal.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useOscar } from '../hooks/useOscar.js';
import { OSCAR_STAGES, OSCAR_PRIZES } from '../config/settings.js';

export default function OscarPage() {
  const { profile, accountId, isAdmin, openAccount } = useApp();
  const { teams, myTeam, status, nameOf, hasVoted, questions, config } = useOscar();
  const [modal, setModal] = useState(null);                       // { type: 'team' | 'nominate', team }
  const canManage = myTeam && (isAdmin || myTeam.directorId === accountId || myTeam.createdBy === accountId);
  // once the admin opens the voting the crew block is hidden from participants; once a crew is sent, it is frozen
  const votingStarted = status !== 'draft';
  const hideCrew = votingStarted && !isAdmin;
  const frozen = !!myTeam?.nominated && !isAdmin;
  // crews may be sent to the voting while the admin keeps the intake open (also while the voting is open)
  const sentCount = teams.filter((t) => t.nominated).length;
  const full = config.expectedTeams > 0 && sentCount >= config.expectedTeams && !myTeam?.nominated;
  const locked = config.intake === 'closed' || full;
  const lockReason = config.intake === 'closed' ? 'The organizers have closed the intake of crews.' : 'All expected crews have already been sent.';

  return (
    <>
      <Marquee className="bg-ink text-white" items={['OSCAR NIGHT', 'CREATE YOUR CREW · SHOOT · PREMIERE', 'ONE VOTE PER PARTICIPANT']} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        <Header back />
        <Banner title="Oscar Night: short film battle" cls="bg-sun">
          Form your production crew, shoot and edit your film, screen it at the red carpet gala — then everybody votes for the winners.
        </Banner>

        {/* prizes + stages */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {OSCAR_PRIZES.map((p, i) => (
            <div key={p.label} className={`border-[3px] border-ink rounded-xl shadow-b4 p-4 ${['bg-hot text-white', 'bg-cobalt text-white', 'bg-white'][i % 3]}`}>
              <div className="font-mono text-xs font-bold uppercase">{p.label}</div>
              <div className="text-3xl font-extrabold">{p.value}</div>
              <div className="font-mono text-xs">{p.note}</div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-extrabold uppercase">The evening in {OSCAR_STAGES.length} stages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {OSCAR_STAGES.map((s, i) => (
              <div key={s.title} className="border-[3px] border-ink rounded-xl shadow-b4 bg-white p-4 flex flex-col gap-2">
                <div className="flex justify-between font-mono text-xs font-bold uppercase"><span>Stage {String(i + 1).padStart(2, '0')}</span></div>
                <h3 className="text-lg font-extrabold uppercase leading-tight">{s.title}</h3>
                <p className="text-sm font-medium">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* my crew: hidden for participants while the voting is on */}
        {hideCrew ? (
          <section className="box shadow-b8 p-6 sm:p-8 bg-ink text-white flex flex-col gap-2">
            <div className="font-mono text-xs font-bold uppercase text-sun">{status === 'open' ? 'Voting is open' : 'Voting is closed'}</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold uppercase">🗳 Time to vote!</h2>
            <p className="text-xl sm:text-2xl font-extrabold uppercase text-neon">Who will be the winner?</p>
          </section>
        ) : (
        <section className="box shadow-b8 overflow-hidden">
          <div className="bg-ink text-white px-4 py-3 font-mono font-bold uppercase">{myTeam ? 'Your film crew' : 'Create your film crew'}</div>
          <div className="p-4 sm:p-6 bg-paper flex flex-col gap-4">
            {votingStarted && isAdmin && <p className="border-[3px] border-ink rounded-xl bg-sun px-3 py-2 font-mono text-xs font-bold">Admin view — this block is hidden from participants while the voting is {status === 'open' ? 'open' : 'closed'}.</p>}
            {!profile && (
              <div className="flex flex-col gap-3 items-start">
                <p className="font-medium">Sign in to create a crew or to see yours.</p>
                <button className="btn bg-neon" onClick={() => openAccount(null)}>Sign in / Register</button>
              </div>
            )}
            {profile && !myTeam && (
              <div className="flex flex-col gap-3 items-start">
                <p className="font-medium">You are not in a crew yet. Press the button, fill in the form and press “Register crew” — all selected people will see the crew in their profile.</p>
                <button className="btn bg-sun" onClick={() => setModal({ type: 'team', team: null })}>🎬 Create film crew</button>
              </div>
            )}
            {profile && myTeam && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="font-mono text-xs font-bold uppercase text-mute">Film / team</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold uppercase break-words">{myTeam.title}</h2>
                  <div className="mt-2 font-mono text-sm"><b>Director:</b> {nameOf(myTeam.directorId)}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(myTeam.memberIds || []).map((u) => <span key={u} className={`tag ${u === myTeam.directorId ? 'bg-sun' : 'bg-white'}`}>{nameOf(u)}{u === myTeam.directorId ? ' · DIR' : ''}</span>)}
                  </div>
                </div>
                <div className="border-[3px] border-ink rounded-xl bg-white p-4 flex flex-col gap-3">
                  <div className="font-mono text-xs font-bold uppercase">Voting nominations</div>
                  <p className="text-sm font-medium">
                    {frozen
                      ? '✓ Your crew has been sent to the voting. Nothing can be changed now — only the organizers can return it to editing.'
                      : myTeam.nominated
                        ? '✓ This crew has been sent to the voting (you can still change it as an admin).'
                        : 'When the film is ready, send your crew to the voting: choose who is nominated in which category. After you send it, nothing can be changed.'}
                    {!myTeam.nominated && locked && ` ${lockReason}`}
                    {!myTeam.nominated && !locked && config.expectedTeams > 0 && ` Crews sent: ${sentCount} of ${config.expectedTeams}.`}
                  </p>
                  {!frozen && (
                    <div className="flex flex-wrap gap-3">
                      <button className="btn bg-neon disabled:opacity-50" disabled={locked && !isAdmin} onClick={() => setModal({ type: 'nominate', team: myTeam })}>
                        {myTeam.nominated ? 'Change nominations' : '🏆 Send to voting'}
                      </button>
                      {canManage && <button className="btn bg-white" onClick={() => setModal({ type: 'team', team: myTeam })}>Edit crew</button>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
        )}

        {/* voting */}
        <section className={`box shadow-b8 p-6 flex flex-col gap-3 items-start ${status === 'open' ? 'bg-neon' : 'bg-white'}`}>
          <h2 className="text-2xl font-extrabold uppercase">The Oscar ballot</h2>
          {status === 'draft' && <p className="font-bold">The voting is not open yet. The organizers will open it after the screening.</p>}
          {status === 'closed' && <p className="font-bold">The voting is closed. The winners will be announced at the gala.</p>}
          {status === 'open' && (hasVoted
            ? <p className="font-bold">✓ You have already voted. Thank you for filling in the form!</p>
            : <><p className="font-bold">The voting is open! Each participant has one ballot.</p><Link to="/oscar/vote" className="btn bg-ink text-neon">Open the ballot →</Link></>)}
          {isAdmin && status !== 'open' && <Link to="/oscar/vote" className="btn bg-sun text-xs">Preview the ballot (admin)</Link>}
        </section>

        {/* all crews */}
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl font-extrabold uppercase">Registered crews · {teams.length}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => (
              <div key={t.id} className={`border-[3px] border-ink rounded-xl shadow-b4 p-4 flex flex-col gap-2 ${t.id === myTeam?.id ? 'bg-sun/40' : 'bg-white'}`}>
                {t.cover && <img src={t.cover} alt={t.title} className="w-full aspect-video object-cover border-[3px] border-ink rounded-lg" />}
                <div className="flex justify-between gap-2 items-start">
                  <h3 className="text-lg font-extrabold uppercase break-words">{t.title}</h3>
                  <span className={`tag shrink-0 ${t.nominated ? 'bg-neon' : 'bg-paper'}`}>{t.nominated ? 'IN VOTING' : 'IN PROGRESS'}</span>
                </div>
                <div className="font-mono text-xs"><b>Dir:</b> {nameOf(t.directorId)} · {(t.memberIds || []).length} members</div>
                <div className="font-mono text-xs text-mute break-words">{(t.memberIds || []).map(nameOf).join(', ')}</div>
              </div>
            ))}
            {teams.length === 0 && <p className="font-mono text-sm col-span-full">No crews yet. Be the first!</p>}
          </div>
        </section>
      </div>
      <Marquee className="bg-sun text-ink" items={['LIGHTS · CAMERA · ACTION', 'GOOD LUCK AND TIME TO EDIT', 'ERASMUS+ OSCAR NIGHT']} />
      {modal?.type === 'team' && <TeamModal team={modal.team} onClose={() => setModal(null)} />}
      {modal?.type === 'nominate' && <NominateModal team={modal.team} questions={questions} onClose={() => setModal(null)} />}
    </>
  );
}
