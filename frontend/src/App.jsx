import { useEffect } from 'react';
import { useChessStore } from './chess/useChessStore';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';

export default function App() {
  const screen = useChessStore((s) => s.screen);
  const error  = useChessStore((s) => s.error);

  useEffect(() => {
    return useChessStore.getState().connect();
  }, []);

  return (
    <div className="h-screen overflow-hidden marble-bg flex flex-col">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-burgundy/95 text-alabaster font-garamond px-6 py-2.5 rounded shadow-stone-lg border border-burgundy/60 text-sm tracking-wide">
            {error}
          </div>
        </div>
      )}

      {screen === 'lobby' ? <Lobby /> : <GameRoom />}
    </div>
  );
}
