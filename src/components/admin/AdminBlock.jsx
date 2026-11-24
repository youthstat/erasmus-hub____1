// One block of the admin page with two controls: hide / show and "full window" (fills the screen).
// The content is rendered once and only re-styled, so anything typed in it is kept when you switch.
export default function AdminBlock({ title, hidden, full, onHide, onFull, children }) {
  return (
    <div className={full ? 'fixed inset-0 z-40 overflow-y-auto bg-paper p-3 sm:p-6' : ''}>
      <div className={full ? 'max-w-7xl mx-auto flex flex-col gap-3' : 'flex flex-col gap-3'}>
        <div className="border-[3px] border-ink rounded-xl bg-white shadow-b2 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <button className="font-mono text-sm font-bold uppercase text-left flex-1 min-w-0 truncate" onClick={onHide} aria-expanded={!hidden}>
            {hidden ? '▶' : '▼'} {title}
          </button>
          <span className="flex gap-2">
            {!full && <button className="tag bg-white" onClick={onHide}>{hidden ? 'SHOW' : 'HIDE'}</button>}
            <button className={`tag ${full ? 'bg-hot text-white' : 'bg-sun'}`} onClick={onFull}>{full ? '✕ CLOSE FULL WINDOW' : '⤢ FULL WINDOW'}</button>
          </span>
        </div>
        {(!hidden || full) && children}
      </div>
    </div>
  );
}
