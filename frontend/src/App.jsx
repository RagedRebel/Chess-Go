import { useState } from 'react';
import useWebSocket from './hooks/useWebSocket';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';

export default function App() {
  const {
    connected,
    gameState,
    gameOver,
    error,
    createRoom,
    joinRoom,
    makeMove,
    resetGame,
  } = useWebSocket();

  const [view, setView] = useState('lobby'); // 'lobby' | 'game'
  const [showGuides, setShowGuides] = useState(true);

  // Transition to game view when we receive game state
  if (gameState && view === 'lobby') {
    setView('game');
  }

  const handleBackToLobby = () => {
    resetGame();
    setView('lobby');
  };

  return (
    <div className="h-screen overflow-hidden marble-bg flex flex-col">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-burgundy/95 text-alabaster font-garamond px-6 py-2.5 rounded shadow-stone-lg border border-gold/30 text-sm tracking-wide">
            {error}
          </div>
        </div>
      )}

      {view === 'lobby' ? (
        <Lobby
          connected={connected}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          showGuides={showGuides}
          onToggleGuides={setShowGuides}
        />
      ) : (
        <GameRoom
          gameState={gameState}
          gameOver={gameOver}
          onMove={makeMove}
          onBackToLobby={handleBackToLobby}
          showGuides={showGuides}
          onToggleGuides={setShowGuides}
        />
      )}
    </div>
  );
}
