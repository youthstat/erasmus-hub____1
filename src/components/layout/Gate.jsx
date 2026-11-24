import Header from './Header.jsx';
import { useApp } from '../../context/AppContext.jsx';

// Wraps a page: when the admin has hidden this section, participants get "not open yet" instead of the page.
export default function Gate({ id, children }) {
  const { isAdmin, homeHidden, homeReady } = useApp();
  const hidden = !!homeHidden[id];
  if (!isAdmin && !homeReady) return null;
  if (hidden && !isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <Header back />
        <div className="box shadow-b8 p-8"><h1 className="text-3xl font-extrabold uppercase">🔒 Not open yet</h1><p className="mt-2 font-medium">The organizers will open this section later. Come back soon!</p></div>
      </div>
    );
  }
  return (
    <>
      {hidden && isAdmin && <div className="bg-sun border-b-[3px] border-ink px-4 py-2 font-mono text-xs font-bold text-center">Admin view — this section is hidden from participants (Admin panel → Home screen).</div>}
      {children}
    </>
  );
}
