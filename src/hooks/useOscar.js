import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import * as oscar from '../firebase/oscar.js';
import { withDefaults } from '../utils/oscar.js';

// Live state of the Oscar Night: crews, voting status and questions, my ballot (and all ballots for the admin)
export function useOscar() {
  const { users, accountId, isAdmin, uid, setError } = useApp();
  const [teams, setTeams] = useState([]);
  const [rawConfig, setRawConfig] = useState(null);
  const [hasVoted, setHasVoted] = useState(null);       // null = not known yet
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    if (!uid) return;
    const onErr = (e) => setError(e.message);
    const offs = [oscar.subscribeTeams(setTeams, onErr), oscar.subscribeOscarConfig(setRawConfig, onErr)];
    if (accountId) offs.push(oscar.subscribeMyVote(accountId, setHasVoted, onErr)); else setHasVoted(false);
    if (isAdmin) offs.push(oscar.subscribeVotes(setVotes, onErr)); else setVotes([]);
    return () => offs.forEach((o) => o());
  }, [uid, accountId, isAdmin, setError]);

  return useMemo(() => {
    const config = withDefaults(rawConfig);
    const nameOf = (id) => users.find((u) => u.id === id)?.name || 'Unknown';
    const sorted = [...teams].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    const myTeam = accountId ? sorted.find((t) => t.memberIds?.includes(accountId)) || null : null;
    const teamOf = (userId) => sorted.find((t) => t.memberIds?.includes(userId)) || null;
    return { teams: sorted, config, status: config.status, questions: config.questions, myTeam, teamOf, nameOf, hasVoted, votes };
  }, [teams, rawConfig, hasVoted, votes, users, accountId]);
}
