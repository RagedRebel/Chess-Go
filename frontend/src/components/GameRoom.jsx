import { useRef, useState } from 'react';
import { useChessStore } from '../chess/useChessStore';
import ChessBoard from './ChessBoard';
import PlayerInfo from './PlayerInfo';
import GameOverModal from './GameOverModal';
import Column from './Column';

export default function GameRoom() {
  const roomCode    = useChessStore((s) => s.roomCode);
  const playerColor = useChessStore((s) => s.playerColor);
  const turn        = useChessStore((s) => s.turn);
  const white       = useChessStore((s) => s.white);
  const black       = useChessStore((s) => s.black);
  const started     = useChessStore((s) => s.started);
  const gameOver    = useChessStore((s) => s.gameOver);
  const gameState   = useChessStore((s) => s.gameState);
  const showGuides  = useChessStore((s) => s.showGuides);
  const toggleGuides = useChessStore((s) => s.toggleGuides);
  const backToLobby  = useChessStore((s) => s.backToLobby);
  const resign       = useChessStore((s) => s.resign);
  const offerDraw    = useChessStore((s) => s.offerDraw);
  const acceptDraw   = useChessStore((s) => s.acceptDraw);
  const declineDraw  = useChessStore((s) => s.declineDraw);
  const drawOffer    = useChessStore((s) => s.drawOffer);

  const boardWrapperRef = useRef(null);
  const [resignConfirm, setResignConfirm] = useState(false);

  if (!gameState) return null;

  const inCheck = gameState.status === 'check';
  const isMyTurn = turn === (playerColor === 'white' ? 'w' : 'b');

  const topPlayer =
    playerColor === 'white'
      ? { name: black || 'Waiting…', color: 'black' }
      : { name: white || 'Waiting…', color: 'white' };
  const bottomPlayer =
    playerColor === 'white'
      ? { name: white || 'You', color: 'white' }
      : { name: black || 'You', color: 'black' };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden py-2 px-4 box-border">

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

      {/* ── Middle row ────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex items-center justify-center gap-2 lg:gap-6 overflow-hidden">

        <div className="hidden lg:flex flex-shrink-0 self-center">
          <Column side="left" />
        </div>

        <div className="flex flex-col items-center h-full py-1 overflow-hidden max-w-[560px] w-full">
          <div className="flex-shrink-0">
            <PlayerInfo
              name={topPlayer.name}
              color={topPlayer.color}
              isActive={started && turn === topPlayer.color[0]}
              position="top"
            />
          </div>

          <div ref={boardWrapperRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
            <ChessBoard boardWrapperRef={boardWrapperRef} />
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
      <div className="flex-shrink-0 flex items-center justify-center gap-2 mt-1 flex-wrap">
        <button onClick={backToLobby} className="stone-btn-secondary text-[11px] py-1.5 px-4">
          Leave Room
        </button>

        {started && !gameOver && (
          <>
            {/* Resign button — two-step confirm */}
            {resignConfirm ? (
              <>
                <span className="font-cinzel text-[10px] text-burgundy uppercase tracking-wide">Resign?</span>
                <button
                  onClick={() => { resign(); setResignConfirm(false); }}
                  className="text-[11px] py-1.5 px-3 rounded border border-burgundy/60 bg-burgundy/10
                             text-burgundy font-cinzel hover:bg-burgundy/20 transition-all duration-200"
                >
                  Yes
                </button>
                <button
                  onClick={() => setResignConfirm(false)}
                  className="stone-btn-secondary text-[11px] py-1.5 px-3"
                >
                  No
                </button>
              </>
            ) : (
              <button
                onClick={() => setResignConfirm(true)}
                className="text-[11px] py-1.5 px-4 rounded border border-stone-gray/40 bg-stone-gray/10
                           text-stone-gray font-cinzel hover:border-burgundy/50 hover:text-burgundy
                           hover:bg-burgundy/10 transition-all duration-200"
              >
                Resign
              </button>
            )}

            {/* Draw offer button */}
            {drawOffer === 'received' ? (
              <>
                <span className="font-cinzel text-[10px] text-gold/90 uppercase tracking-wide animate-pulse">
                  Draw offered
                </span>
                <button
                  onClick={acceptDraw}
                  className="text-[11px] py-1.5 px-3 rounded border border-gold/50 bg-gold/10
                             text-gold font-cinzel hover:bg-gold/20 transition-all duration-200"
                >
                  Accept
                </button>
                <button
                  onClick={declineDraw}
                  className="stone-btn-secondary text-[11px] py-1.5 px-3"
                >
                  Decline
                </button>
              </>
            ) : (
              <button
                onClick={offerDraw}
                disabled={drawOffer === 'sent'}
                className={`text-[11px] py-1.5 px-4 rounded border font-cinzel transition-all duration-200
                  ${
                    drawOffer === 'sent'
                      ? 'border-gold/30 bg-gold/5 text-gold/50 cursor-not-allowed'
                      : 'border-gold/40 bg-gold/10 text-gold/80 hover:border-gold hover:text-gold hover:bg-gold/20'
                  }`}
              >
                {drawOffer === 'sent' ? 'Draw Offered…' : 'Offer Draw'}
              </button>
            )}
          </>
        )}

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => toggleGuides(e.target.checked)}
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
          onClose={backToLobby}
        />
      )}
    </div>
  );
}
