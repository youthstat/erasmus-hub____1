import Header from '../components/layout/Header.jsx';
import { Banner } from '../components/games/RulesBits.jsx';

import { PADLET_URL } from '../config/settings.js';
export { PADLET_URL };

export default function ReflectionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <Header back />
      <Banner title="Daily reflection" cls="bg-cobalt text-white">
        Record your daily impressions and shape the emotional pulse of the festival. Reflections are collected on our Padlet board.
      </Banner>
      <div className="box shadow-b8 p-6 flex flex-col gap-4 items-start">
        <p className="font-medium">Press the button, log in to Padlet and add your reflection for today.</p>
        <a href={PADLET_URL} target="_blank" rel="noopener noreferrer" className="btn bg-sun">Open Padlet →</a>
      </div>
    </div>
  );
}
