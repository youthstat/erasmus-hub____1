import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import ModalShell from './ModalShell.jsx';

export default function ThankYouModal() {
  const { closeModal } = useApp();
  const navigate = useNavigate();
  const goHome = () => { closeModal(); navigate('/'); };
  return (
    <ModalShell title="Submission success" onClose={goHome}>
      <span className="tag bg-neon shadow-b4 -rotate-1 self-start text-sm px-4 py-1.5">✓ Verification dispatched</span>
      <h1 className="text-3xl font-bold uppercase">Thank you!</h1>
      <p className="max-w-xl text-[#4b4731]">
        Your mission has been logged into the <b className="text-ink">Erasmus+ verification queue</b>.
        Moderators will check it and credit your points on the leaderboard shortly.
      </p>
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-3 border-t-[3px] border-ink">
        <button className="btn bg-white" onClick={() => { closeModal(); navigate('/leaderboard'); }}>View leaderboard</button>
        <button className="btn bg-sun" onClick={goHome}>Exit to hub →</button>
      </div>
    </ModalShell>
  );
}
