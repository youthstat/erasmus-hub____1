import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import GamePanel from '../components/games/GamePanel.jsx';
import { Step, Card, List, Banner } from '../components/games/RulesBits.jsx';

const IDEAS = [
  ['Stealth morning tea / coffee', 'Find out if your friend likes tea or coffee and quietly place a warm cup at their seat before the session.'],
  ['Memes & doodles', 'Draw an inside joke about the energizers or the lunch queue and slip it into their workbook.'],
  ['DJ dedication', 'Ask the party DJ to play their favourite or home-country song with an anonymous shout-out.'],
  ['Origami & comics', 'A paper crane, a tiny heart or a comic strip on a napkin — handmade means the most.'],
  ['Energy snack drop', 'After a hike or a long activity, slip an orange, a cereal bar or a local sweet into their pocket.'],
  ['Anonymous kudos', 'Write a sticky note on the Reflection wall: “your presentation today was amazing!”'],
];

export default function SecretFriendPage() {
  return (
    <>
      <Marquee items={['SECRET FRIEND PROTOCOL', '100% STEALTH', '0–2 € MAXIMUM BUDGET']} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        <Header back />
        <Banner title="Secret friend" cls="bg-neon">
          The warmest Erasmus+ tradition. Sign in to your account and press one button to see whose secret friend you are. Secretly make that person’s days better — until the reveal at the final gala.
        </Banner>

        <GamePanel game="sf" />

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-extrabold uppercase">How it works — 4 steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Step n="01" tag="Join" title="Sign in" cls="bg-sun">
              <p className="text-sm font-medium">Sign in to your account (Sign in / Register at the top). Your name is used automatically. Write what you like and what you do not — your secret friend will see it. Then press “Join the Secret friend game”.</p>
            </Step>
            <Step n="02" tag="Draw" title="See who it is" cls="bg-neon">
              <p className="text-sm font-medium">Press “Show me who I am secret friend of”. You see the name, the country and the wishes of the person you secretly take care of. Nobody gets themselves, and every name is given to only one participant.</p>
            </Step>
            <Step n="03" tag="Days 2–6" title="Stealth care" cls="bg-cobalt text-white">
              <p className="text-sm font-medium">Small kind gestures: a note, tea, a snack, a song. Never about money — about attention.</p>
            </Step>
            <Step n="04" tag="Final gala" title="The reveal" cls="bg-hot text-white">
              <p className="text-sm font-medium">Your friend sits in the middle and gets 3 guesses. Then you say “It was me!”, hug and give a postcard.</p>
            </Step>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-extrabold uppercase">Care idea vault <span className="tag bg-sun align-middle">Budget 0–2 €</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {IDEAS.map(([t, d], i) => <Card key={t} title={`Idea ${String(i + 1).padStart(2, '0')}`}><b className="text-base uppercase">{t}</b><span>{d}</span></Card>)}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="✓ Do" cls="bg-neon/40">
            <List mark="✓" items={[
              'Check allergies and diet before giving snacks.',
              'Give genuine emotions, not money: notes, encouragement, helping tidy up.',
              'Use co-conspirators — let others deliver the surprise to cover your tracks.',
            ]} />
          </Card>
          <Card title="✕ Don’t" cls="bg-hot/20">
            <List mark="✕" items={[
              'Never reveal who you are before the gala night.',
              'No hurtful pranks, scary or sarcastic jokes.',
              'No expensive gifts — Erasmus+ is about equality and inclusion.',
            ]} />
          </Card>
        </section>
      </div>
      <Marquee className="bg-neon text-ink" items={['KEEP YOUR TARGET UNNOTICED', 'REVEAL AT FAREWELL GALA', 'FUNDED BY ERASMUS+']} />
    </>
  );
}
