import { useRef, useState, useEffect } from 'react';
import { useChessStore } from '../chess/useChessStore';
import ChessBoard from './ChessBoard';
import PlayerInfo from './PlayerInfo';
import GameOverModal from './GameOverModal';
import Column from './Column';
import { useSounds } from '../hooks/useSounds';

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
  const offerDraw       = useChessStore((s) => s.offerDraw);
  const acceptDraw      = useChessStore((s) => s.acceptDraw);
  const declineDraw     = useChessStore((s) => s.declineDraw);
  const drawOffer       = useChessStore((s) => s.drawOffer);
  const drawDeclined    = useChessStore((s) => s.drawDeclined);
  const clearDrawDeclined = useChessStore((s) => s.clearDrawDeclined);

  const lastMove    = useChessStore((s) => s.lastMove);

  const boardWrapperRef = useRef(null);
  const [resignConfirm, setResignConfirm] = useState(false);
  const [drawConfirm, setDrawConfirm]     = useState(false);

  const play = useSounds();

  useEffect(() => {
    if (lastMove) play('move');
  }, [lastMove, play]);

  const prevStatusRef = useRef(null);
  useEffect(() => {
    const status = gameState?.status;
    if (status === 'check' && prevStatusRef.current !== 'check') {
      play('check');
    }
    prevStatusRef.current = status;
  }, [gameState?.status, play]);

  useEffect(() => {
    if (!gameOver) return;
    const isDraw = gameOver.result === 'draw';
    if (isDraw) return; 
    const won = gameOver.result === playerColor;
    play(won ? 'win' : 'lose');
  }, [gameOver, playerColor, play]);

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
          <span className="font-cinzel text-[10px] uppercase tracking-widest text-alabaster/40">Room</span>
          <span className="font-cinzel text-sm tracking-[0.2em] text-alabaster bg-navy/70 border border-gold/30 px-3 py-0.5 rounded">
            {roomCode}
          </span>
        </div>
        {!started && (
          <span className="font-playfair text-xs italic text-alabaster/50">
            Share this code with your opponent…
          </span>
        )}
        {started && !gameOver && (
          <span className="font-playfair text-xs text-alabaster/60">
            {isMyTurn
              ? <span className="text-gold font-semibold">Your move</span>
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
            {/* Resign */}
            <button
              onClick={() => setResignConfirm(true)}
              className="text-[11px] py-1.5 px-4 rounded border border-alabaster/20 bg-alabaster/5
                         text-alabaster/60 font-cinzel hover:border-burgundy/60 hover:text-burgundy
                         hover:bg-burgundy/10 transition-all duration-200"
            >
              Resign
            </button>

            {/* Offer Draw button — only shown when no draw is in flight */}
            <button
              onClick={() => setDrawConfirm(true)}
              disabled={drawOffer === 'sent' || drawOffer === 'received'}
              className={`text-[11px] py-1.5 px-4 rounded border font-cinzel transition-all duration-200
                ${
                  drawOffer === 'sent'
                    ? 'border-gold/30 bg-gold/5 text-gold/50 cursor-not-allowed'
                    : 'border-gold/40 bg-gold/10 text-gold/80 hover:border-gold hover:text-gold hover:bg-gold/20'
                }`}
            >
              {drawOffer === 'sent' ? 'Draw Offered…' : 'Offer Draw'}
            </button>
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
            <div className="w-8 h-4 bg-alabaster/20 rounded-full peer-checked:bg-gold/60 transition-colors duration-250" />
            <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-alabaster rounded-full shadow peer-checked:translate-x-4 transition-transform duration-250" />
          </div>
          <span className="font-garamond text-[11px] text-alabaster/50">Guides</span>
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

      {/* ── Resign Confirmation Modal ─────────────────── */}
      {resignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy border border-burgundy/40 rounded-lg px-8 py-6 shadow-2xl flex flex-col items-center gap-4 w-72">
            <h2 className="font-cinzel text-base uppercase tracking-widest text-alabaster">Resign?</h2>
            <p className="font-garamond text-sm text-alabaster/60 text-center">
              Are you sure you want to resign this game?
            </p>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => { resign(); setResignConfirm(false); }}
                className="text-sm py-2 px-5 rounded border border-burgundy/60 bg-burgundy/10
                           text-burgundy font-cinzel hover:bg-burgundy/25 transition-all duration-200"
              >
                Yes, Resign
              </button>
              <button
                onClick={() => setResignConfirm(false)}
                className="stone-btn-secondary text-sm py-2 px-5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Offer Draw Confirmation Modal ────────────── */}
      {drawConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy border border-gold/30 rounded-lg px-8 py-6 shadow-2xl flex flex-col items-center gap-4 w-72">
            <h2 className="font-cinzel text-base uppercase tracking-widest text-gold">Offer Draw?</h2>
            <p className="font-garamond text-sm text-alabaster/60 text-center">
              Send a draw offer to your opponent?
            </p>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => { offerDraw(); setDrawConfirm(false); }}
                className="text-sm py-2 px-5 rounded border border-gold/50 bg-gold/10
                           text-gold font-cinzel hover:bg-gold/25 transition-all duration-200"
              >
                Send Offer
              </button>
              <button
                onClick={() => setDrawConfirm(false)}
                className="stone-btn-secondary text-sm py-2 px-5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Draw Offer Received — auto popup to the opponent ── */}
      {drawOffer === 'received' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy border border-gold/40 rounded-lg px-8 py-6 shadow-2xl flex flex-col items-center gap-4 w-72">
            <h2 className="font-cinzel text-base uppercase tracking-widest text-gold">Draw Offered</h2>
            <p className="font-garamond text-sm text-alabaster/60 text-center">
              Your opponent is offering a draw. Do you accept?
            </p>
            <div className="flex gap-3 mt-1">
              <button
                onClick={acceptDraw}
                className="text-sm py-2 px-5 rounded border border-gold/50 bg-gold/10
                           text-gold font-cinzel hover:bg-gold/25 transition-all duration-200"
              >
                Accept
              </button>
              <button
                onClick={declineDraw}
                className="stone-btn-secondary text-sm py-2 px-5"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Draw Declined notification — shown to the offerer ── */}
      {drawDeclined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy border border-burgundy/30 rounded-lg px-8 py-6 shadow-2xl flex flex-col items-center gap-4 w-72">
            <h2 className="font-cinzel text-base uppercase tracking-widest text-alabaster">Draw Declined</h2>
            <p className="font-garamond text-sm text-alabaster/60 text-center">
              Your opponent has declined the draw offer.
            </p>
            <button
              onClick={clearDrawDeclined}
              className="stone-btn-secondary text-sm py-2 px-6"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
