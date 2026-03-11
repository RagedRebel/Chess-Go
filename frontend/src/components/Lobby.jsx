import { useState } from 'react';
import { useChessStore } from '../chess/useChessStore';
import LaurelWreath from './LaurelWreath';

export default function Lobby() {
  const connected    = useChessStore((s) => s.connected);
  const reconnecting = useChessStore((s) => s.reconnecting);
  const showGuides   = useChessStore((s) => s.showGuides);
  const toggleGuides = useChessStore((s) => s.toggleGuides);
  const createRoom   = useChessStore((s) => s.createRoom);
  const joinRoom     = useChessStore((s) => s.joinRoom);

  const [roomCode, setRoomCode]   = useState('');
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError]   = useState(false);
  const [mode, setMode] = useState(null); // null | 'create' | 'join'

  const trimmedName = playerName.trim();

  const handleNameBlur = () => {
    if (!trimmedName) setNameError(true);
  };

  const handleNameChange = (e) => {
    setPlayerName(e.target.value);
    if (e.target.value.trim()) setNameError(false);
  };

  const validateAndRun = (fn) => {
    if (!trimmedName) {
      setNameError(true);
      return;
    }
    fn();
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.trim().length > 0) {
      joinRoom(roomCode.trim(), trimmedName);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center px-4">
      {/* Title */}
      <div className="text-center mb-6 animate-fade-in">
        <LaurelWreath className="mx-auto mb-3 w-20 h-20 text-gold" />
        <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-alabaster tracking-wider">
          ChessGo
        </h1>
        <p className="font-playfair text-alabaster/50 text-base mt-1.5 italic">
          A Classy Chess Experience - Powered by Golang
        </p>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-5">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full transition-colors duration-350 ${
            connected ? 'bg-green-500' : reconnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span className="font-garamond text-sm text-alabaster/50">
          {connected ? 'Connected to server' : reconnecting ? 'Reconnecting…' : 'Connecting…'}
        </span>
      </div>

      {/* Name Input — always visible before entering a room */}
      {!mode && (
        <div className="flex flex-col items-center gap-5 animate-slide-up w-full max-w-xs">
          {/* Player Name */}
          <div className="w-full">
            <label className="block font-cinzel text-[11px] uppercase tracking-widest text-alabaster/50 mb-1.5 text-center">
              Your Name <span className="text-burgundy">*</span>
            </label>
            <input
              type="text"
              value={playerName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              placeholder="Enter your name to play"
              maxLength={20}
              className={`w-full text-center font-playfair text-base bg-navy/60 border rounded px-4 py-2.5 text-alabaster
                         placeholder:text-alabaster/30 focus:outline-none focus:shadow-gold-glow
                         transition-all duration-250 ease-dignified
                         ${
                           nameError
                             ? 'border-burgundy/70 focus:border-burgundy'
                             : 'border-gold/30 focus:border-gold'
                         }`}
            />
            {nameError && (
              <p className="mt-1.5 text-center font-garamond text-xs text-burgundy animate-fade-in">
                A name is required before you can play.
              </p>
            )}
          </div>

          {/* Move Guidelines Toggle
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div className="relative">
              <input
                type="checkbox"
                checked={showGuides}
                onChange={(e) => toggleGuides(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-alabaster/20 rounded-full peer-checked:bg-gold/60
                              transition-colors duration-250 ease-dignified" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-alabaster rounded-full shadow
                              peer-checked:translate-x-4 transition-transform duration-250 ease-dignified" />
            </div>
            <span className="font-garamond text-sm text-alabaster/60 group-hover:text-alabaster transition-colors duration-200">
              Show valid moves
            </span>
          </label> */}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => validateAndRun(() => {
                setMode('create');
                createRoom(trimmedName);
              })}
              disabled={!connected}
              className="stone-btn flex-1"
            >
              Create Room
            </button>
            <button
              onClick={() => validateAndRun(() => setMode('join'))}
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
          <label className="font-cinzel text-sm uppercase tracking-widest text-alabaster/70">
            Enter Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="e.g. A3K9Z2"
            maxLength={6}
            className="w-48 text-center font-cinzel text-2xl tracking-[0.3em] bg-navy/60 border-2 border-gold/40
                       rounded px-4 py-3 text-alabaster placeholder:text-alabaster/30
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
