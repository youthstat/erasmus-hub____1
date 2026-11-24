import Marquee from '../components/layout/Marquee.jsx';
import Header from '../components/layout/Header.jsx';
import GamePanel from '../components/games/GamePanel.jsx';
import KillerBoard from '../components/games/KillerBoard.jsx';
import { Step, Card, List, Banner } from '../components/games/RulesBits.jsx';

export default function KillerGamePage() {
  return (
    <>
      <Marquee className="bg-hot text-white" items={['KILLER GAME PROTOCOL', 'TRACK · STAY COVERT · PASS CONTRACT', 'LAST SURVIVOR WINS THE CUP']} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        <Header back />
        <Banner title="Killer game" cls="bg-hot text-white">
          A social stealth game that runs through the whole project. Everyone has one victim and one object. Make your victim willingly touch the object — zero violence, pure charisma.
        </Banner>

        <GamePanel game="kg" />
        <KillerBoard />

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-extrabold uppercase">How it works — 4 steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Step n="01" tag="Join" title="Sign in + object" cls="bg-sun">
              <p className="text-sm font-medium">Sign in to your account — your name is used automatically. The only thing you write is one safe everyday object (pen, fork, apple, badge). Then press “Join the Killer game”.</p>
            </Step>
            <Step n="02" tag="Draw" title="Victim + weapon" cls="bg-neon">
              <p className="text-sm font-medium">Press “Show me my victim and object”. You see the name and country of your victim and the object to use. Names and objects are shuffled; your own object is allowed, your own name never.</p>
            </Step>
            <Step n="03" tag="Attack" title="The touch" cls="bg-cobalt text-white">
              <p className="text-sm font-medium">The victim must willingly touch or hold the item. Use any friendly pretext: “Could you hold my notebook for a second?”. Throwing or forcing is forbidden.</p>
            </Step>
            <Step n="04" tag="Chain" title="Inheritance" cls="bg-hot text-white">
              <p className="text-sm font-medium">The eliminated player admits it and posts in the camp chat who got them (and with what). The killer presses “I killed my victim” — the victim is crossed out on the board and shown “You have been killed”, and the killer inherits their contract: the next victim and item appear on the killer’s screen.</p>
            </Step>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="✕ Strictly forbidden — disqualification" cls="bg-hot/20">
            <List mark="✕" items={[
              'No physical force: no throwing, trapping or forcing items into hands.',
              'No hazardous objects: knives, broken glass, heavy or dirty things.',
              'No invasion of privacy: sleep, bathrooms, showers, emotional moments.',
              'No accomplices: do not ask third parties to pass the weapon. Solo work only.',
            ]} />
          </Card>
          <Card title="✓ Golden rules" cls="bg-neon/40">
            <List mark="✓" items={[
              'Acting skills and a believable cover story.',
              'Fair play: if you touched the item, smile and admit defeat.',
              'Stay cool — don’t stare at or follow your victim.',
              'Humour and positive vibes: connection is the real goal.',
            ]} />
          </Card>
        </section>

        <section className="box shadow-b8 p-6 bg-sun">
          <h2 className="text-2xl font-extrabold uppercase">🏆 Grand prize</h2>
          <p className="mt-2 font-bold">The last surviving agent becomes MASTER KILLER: the cup, an official merch box and +500 points on the leaderboard.</p>
          <p className="mt-2 text-sm font-medium">Never show your victim and item to anyone. If you reveal your weapon, your victim will never touch it!</p>
        </section>
      </div>
      <Marquee className="bg-ink text-white" items={['TOP SECRET', 'CLASSIFIED SEC-OPS', 'FUNDED BY ERASMUS+']} />
    </>
  );
}
