import { useApp } from '../../context/AppContext.jsx';
import AdminAuthModal from './AdminAuthModal.jsx';
import MissionModal from './MissionModal.jsx';
import ThankYouModal from './ThankYouModal.jsx';
import AccountModal from './AccountModal.jsx';
import MissionEditorModal from './MissionEditorModal.jsx';
import UserEditorModal from './UserEditorModal.jsx';

export default function ModalHost() {
  const { modal } = useApp();
  if (!modal) return null;
  switch (modal.type) {
    case 'auth': return <AdminAuthModal />;
    case 'mission': return <MissionModal mission={modal.mission} />;
    case 'thanks': return <ThankYouModal />;
    case 'account': return <AccountModal next={modal.next} />;
    case 'userEditor': return <UserEditorModal user={modal.user} />;
    case 'editor': return <MissionEditorModal mission={modal.mission} />;
    default: return null;
  }
}
