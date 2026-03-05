import { useState } from 'react';
import LaurelWreath from './LaurelWreath';

export default function Lobby({ connected, onCreateRoom, onJoinRoom, showGuides, onToggleGuides }) {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [mode, setMode] = useState(null); // null | 'create' | 'join'

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim().length > 0) {
      onJoinRoom(roomCode.trim(), playerName.trim());
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center px-4">
      {/* Title */}
      <div className="text-center mb-6 animate-fade-in">
        <LaurelWreath className="mx-auto mb-3 w-20 h-20 text-gold" />
        <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-navy tracking-wider">
          ChessGo
        </h1>
        <p className="font-playfair text-stone-gray text-base mt-1.5 italic">
          A Neoclassical Chess Experience
        </p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-5">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full transition-colors duration-350 ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="font-garamond text-sm text-stone-gray">
          {connected ? 'Connected to server' : 'Connecting…'}
        </span>
      </div>

      {/* Name Input — always visible before entering a room */}
      {!mode && (
        <div className="flex flex-col items-center gap-5 animate-slide-up w-full max-w-xs">
          {/* Player Name */}
          <div className="w-full">
            <label className="block font-cinzel text-[11px] uppercase tracking-widest text-navy/60 mb-1.5 text-center">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full text-center font-playfair text-base bg-white/60 border border-gold/30
                         rounded px-4 py-2.5 text-navy placeholder:text-stone-gray/40
                         focus:outline-none focus:border-gold focus:shadow-gold-glow
                         transition-all duration-250 ease-dignified"
            />
          </div>

          {/* Move Guidelines Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                checked={showGuides}
                onChange={(e) => onToggleGuides(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-gray/30 rounded-full peer-checked:bg-gold/60
                              transition-colors duration-250 ease-dignified" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow
                              peer-checked:translate-x-4 transition-transform duration-250 ease-dignified" />
            </div>
            <span className="font-garamond text-sm text-navy/70 group-hover:text-navy transition-colors duration-200">
              Show valid moves
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => {
                setMode('create');
                onCreateRoom(playerName.trim());
              }}
              disabled={!connected}
              className="stone-btn flex-1"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              disabled={!connected}
              className="stone-btn flex-1"
            >
              Join Room
            </button>
          </div>
        </div>
      )}

      {/* Join Room Form */}
      {mode === 'join' && (
        <form
          onSubmit={handleJoin}
          className="flex flex-col items-center gap-4 animate-slide-up"
        >
          <label className="font-cinzel text-sm uppercase tracking-widest text-navy/70">
            Enter Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="e.g. A3K9Z2"
            maxLength={6}
            className="w-48 text-center font-cinzel text-2xl tracking-[0.3em] bg-white/60 border-2 border-gold/40
                       rounded px-4 py-3 text-navy placeholder:text-stone-gray/50
                       focus:outline-none focus:border-gold focus:shadow-gold-glow
                       transition-all duration-250 ease-dignified"
            autoFocus
          />
          <div className="flex gap-3">
            <button type="submit" disabled={!roomCode.trim()} className="stone-btn text-sm">
              Join
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="stone-btn-secondary text-sm"
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
