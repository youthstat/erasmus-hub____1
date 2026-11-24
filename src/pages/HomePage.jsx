import { Link } from 'react-router-dom';
import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import MissionsSection from '../components/missions/MissionsSection.jsx';
import { useApp } from '../context/AppContext.jsx';
import { countryOf } from '../hooks/useGame.js';
import PointsDelta from '../components/ui/PointsDelta.jsx';
import { PADLET_URL, HOME_MARQUEE_TOP, HOME_MARQUEE_BOTTOM } from '../config/settings.js';

const NAV = [
  { id: 'schedule', to: '/schedule', title: 'Schedule & timeline', text: 'Daily mission timeline, pop-up session alerts, and assigned checkpoints.', cta: 'View full schedule', cls: 'bg-sun', btn: 'bg-ink text-sun' },
  { id: 'secret-friend', to: '/secret-friend', title: 'Secret friend', text: 'Receive your match, deliver gifts, and uncover who has your wishlist.', cta: 'Go to secret friend', cls: 'bg-neon', btn: 'bg-ink text-neon' },
  { id: 'killer-game', to: '/killer-game', title: 'Killer game', text: 'Your secret target is assigned. Tag rivals with verbal traps before you get tagged.', cta: 'Go to killer game', cls: 'bg-hot text-white', btn: 'bg-white text-hot' },
  { id: 'oscar', to: '/oscar', title: 'Oscar Night', text: 'Create your film crew, send your nominees to the voting and cast your Oscar ballot.', cta: 'Go to Oscar Night', cls: 'bg-ink text-white', btn: 'bg-sun text-ink' },
  { id: 'punishment', to: '/punishment', title: 'Punishment box', text: 'Write a punishment (+1 point) or dare to pull one out of the box (−3 points).', cta: 'Open the box', cls: 'bg-[#FFB3C6]', btn: 'bg-ink text-white' },
  { id: 'ask', to: '/ask', title: 'Ask the Team', text: 'A question or a problem? Write to the organizers and facilitators — anonymously or with your name. Late for a session? Tell us here.', cta: 'Ask for help', cls: 'bg-white', btn: 'bg-hot text-white' },
  { id: 'gossips', to: '/gossips', title: 'Gossip board', text: 'Whisper a gossip anonymously — any time. Reading the board opens only with the password from the organizers.', cta: 'Open gossip board', cls: 'bg-neon', btn: 'bg-ink text-neon' },
  { id: 'reflection', to: '/reflection', href: PADLET_URL, title: 'Daily reflection', text: "Record daily impressions and shape the festival's emotional pulse.", cta: 'Go to reflection', cls: 'bg-cobalt text-white', btn: 'bg-white text-cobalt' },
];

export default function HomePage() {
  const { users, accountId, isAdmin, lastChange, homeHidden, homeReady } = useApp();
  const vis = (id) => isAdmin || (homeReady && !homeHidden[id]);      // hidden by the admin = not shown to participants
  const dim = (id) => (isAdmin && homeHidden[id] ? 'opacity-50' : '');
  const hiddenTag = (id) => isAdmin && homeHidden[id] && <span className="tag bg-sun text-xs">HIDDEN FROM PARTICIPANTS</span>;
  const cards = NAV.filter((n) => vis(n.id));
  return (
    <>
      <Marquee items={HOME_MARQUEE_TOP} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
        <div>
          <Header />
          <div className="box shadow-b8 p-6 md:p-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase leading-tight tracking-tight">ERASMUS+</h1>
            <p className="text-base sm:text-lg mt-2 font-bold">
              All-hands & festival hub {isAdmin && <span className="tag bg-sun text-sm">ADMIN MODE</span>}
            </p>
          </div>
        </div>

        {vis('missions') && <div className={dim('missions')}>{hiddenTag('missions')}<MissionsSection /></div>}

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {vis('ranking') && <div className={`lg:col-span-5 box overflow-hidden flex flex-col ${dim('ranking')}`}>
            <div className="bg-sun border-b-[3px] border-ink px-4 py-2.5 font-mono font-bold uppercase">Ranking — all participants</div>
            <div className="divide-y-[3px] divide-ink flex-1 max-h-[34rem] overflow-y-auto">
              {users.map((p, i) => (
                <div key={p.id} className={`p-3 flex items-center justify-between gap-2 ${p.id === accountId ? 'bg-sun/25' : ''}`}>
                  <div><b>#{String(i + 1).padStart(2, '0')} {p.name}</b><div className="font-mono text-[11px] text-mute">{countryOf(p)}</div></div>
                  <b className="font-mono">{(p.score ?? 0).toLocaleString('en-US')} PTS<PointsDelta change={lastChange[p.id]} /></b>
                </div>
              ))}
              {users.length === 0 && <p className="p-3 font-mono text-sm">No participants yet.</p>}
            </div>
            <div className="bg-paper border-t-[3px] border-ink p-3">
              <Link to="/leaderboard" className="btn bg-sun w-full text-xs">View full leaderboard [{users.length}] →</Link>
            </div>
          </div>}

          <div className={`${vis('ranking') ? 'lg:col-span-7 sm:grid-cols-2' : 'lg:col-span-12 sm:grid-cols-2 lg:grid-cols-3'} grid grid-cols-1 gap-4`}>
            {cards.map((n) => (
              <div key={n.to} className={`border-[3px] border-ink p-5 rounded-xl shadow-b4 flex flex-col justify-between ${n.cls} ${dim(n.id)}`}>
                <div><h3 className="text-2xl font-extrabold uppercase">{n.title}</h3>{hiddenTag(n.id)}<p className="text-xs mt-2 font-medium">{n.text}</p></div>
                {n.href
                  ? <a href={n.href} target="_blank" rel="noopener noreferrer" className={`btn mt-4 text-xs ${n.btn}`}>{n.cta} →</a>
                  : <Link to={n.to} className={`btn mt-4 text-xs ${n.btn}`}>{n.cta} →</Link>}
              </div>
            ))}
          </div>
        </section>
      </div>
      <Marquee className="bg-neon text-ink" items={HOME_MARQUEE_BOTTOM} />
    </>
  );
}
