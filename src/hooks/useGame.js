import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import * as games from '../firebase/games.js';

// Live state of one game: players, admin-excluded people, who plays, who is dead
export function useGame(game) {
  const { users, setError } = useApp();
  const [players, setPlayers] = useState([]);
  const [excluded, setExcluded] = useState([]);

  useEffect(() => {
    const onErr = (e) => setError(e.message);
    const offs = [games.subscribePlayers(game, setPlayers, onErr), games.subscribeExcluded(game, setExcluded, onErr)];
    return () => offs.forEach((o) => o());
  }, [game, setError]);

  return useMemo(() => {
    const ex = new Set(excluded);
    const byId = new Map(players.map((p) => [p.id, p]));
    const playing = users.filter((u) => !ex.has(u.id));       // people the admin enabled for this game
    const dead = new Set(players.filter((p) => p.dead).map((p) => p.id));
    return { players, byId, excluded: ex, playing, dead, nameOf: (id) => users.find((u) => u.id === id)?.name || 'Unknown',
      countryOfId: (id) => countryOf(users.find((u) => u.id === id)) };
  }, [players, excluded, users]);
}

export const countryOf = (u) => u?.country || u?.clan || '';
