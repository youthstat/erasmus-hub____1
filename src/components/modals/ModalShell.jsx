export default function ModalShell({ title, onClose, children, maxW = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}>
      <div className={`w-full ${maxW} bg-white border-4 border-ink rounded-2xl shadow-[10px_10px_0_#111] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}>
        <div className="bg-sun px-4 py-3 border-b-[3px] border-ink flex items-center justify-between">
          <span className="font-mono font-bold uppercase truncate">■ {title}</span>
          <button onClick={onClose} aria-label="Close"
            className="w-6 h-6 border-2 border-ink bg-hot text-white font-bold flex items-center justify-center">✕</button>
        </div>
        <div className="p-6 md:p-8 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
