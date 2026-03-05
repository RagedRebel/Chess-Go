import { useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from './ChessBoard';
import PlayerInfo from './PlayerInfo';
import GameOverModal from './GameOverModal';
import Column from './Column';

export default function GameRoom({ gameState, gameOver, onMove, onBackToLobby, showGuides, onToggleGuides }) {
  if (!gameState) return null;

  const {
    fen,
    turn,
    roomCode,
    white,
    black,
    playerColor,
    started,
  } = gameState;

  // ref for the board wrapper — ChessBoard watches its size
  const boardWrapperRef = useRef(null);

  // Derive check status client-side via chess.js
  const inCheck = useMemo(() => {
    try {
      const g = new Chess(fen);
      return g.isCheck();
    } catch {
      return false;
    }
  }, [fen]);

  const isMyTurn = turn === playerColor?.[0];

  const topPlayer =
    playerColor === 'white'
      ? { name: black || 'Waiting…', color: 'black' }
      : { name: white || 'Waiting…', color: 'white' };
  const bottomPlayer =
    playerColor === 'white'
      ? { name: white || 'You', color: 'white' }
      : { name: black || 'You', color: 'black' };

  return (
    // Full viewport, flex column, NO overflow
    <div className="h-screen w-screen flex flex-col overflow-hidden py-2 px-4 box-border">

      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 mb-1 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="font-cinzel text-[10px] uppercase tracking-widest text-stone-gray">Room</span>
          <span className="font-cinzel text-sm tracking-[0.2em] text-navy bg-white/50 border border-gold/30 px-3 py-0.5 rounded">
            {roomCode}
          </span>
        </div>
        {!started && (
          <span className="font-playfair text-xs italic text-stone-gray">
            Share this code with your opponent…
          </span>
        )}
        {started && !gameOver && (
          <span className="font-playfair text-xs text-navy/70">
            {isMyTurn
              ? <span className="text-burgundy font-semibold">Your move</span>
              : <span>Opponent is thinking…</span>}
            {inCheck && <span className="ml-1.5 text-burgundy font-bold">— Check!</span>}
          </span>
        )}
      </div>

      {/* ── Middle row — takes all remaining height ────── */}
      <div className="flex-1 min-h-0 flex items-center justify-center gap-2 lg:gap-6 overflow-hidden">

        <div className="hidden lg:flex flex-shrink-0 self-center">
          <Column side="left" />
        </div>

        {/* Board column — fills available height */}
        <div className="flex flex-col items-center h-full py-1 overflow-hidden">
          <div className="flex-shrink-0">
            <PlayerInfo
              name={topPlayer.name}
              color={topPlayer.color}
              isActive={started && turn === topPlayer.color[0]}
              position="top"
            />
          </div>

          {/* Board wrapper — flex-1 so it takes remaining column height */}
          <div ref={boardWrapperRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
            <ChessBoard
              fen={fen}
              playerColor={playerColor}
              onMove={onMove}
              isMyTurn={isMyTurn}
              gameStarted={started}
              gameOver={!!gameOver}
              showGuides={showGuides}
              boardWrapperRef={boardWrapperRef}
            />
          </div>

          <div className="flex-shrink-0">
            <PlayerInfo
              name={bottomPlayer.name}
              color={bottomPlayer.color}
              isActive={started && turn === bottomPlayer.color[0]}
              position="bottom"
            />
          </div>
        </div>

        <div className="hidden lg:flex flex-shrink-0 self-center">
          <Column side="right" />
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 mt-1">
        <button onClick={onBackToLobby} className="stone-btn-secondary text-[11px] py-1.5 px-4">
          Leave Room
        </button>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => onToggleGuides(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-stone-gray/30 rounded-full peer-checked:bg-gold/60 transition-colors duration-250" />
            <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform duration-250" />
          </div>
          <span className="font-garamond text-[11px] text-navy/60">Guides</span>
        </label>
      </div>

      {gameOver && (
        <GameOverModal
          result={gameOver.result}
          method={gameOver.method}
          playerColor={playerColor}
          onClose={onBackToLobby}
        />
      )}
    </div>
  );
}
