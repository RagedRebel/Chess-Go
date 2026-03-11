import { useMemo, useState, useEffect } from 'react';
import { useChessStore } from '../chess/useChessStore';
import ChessPiece from './ChessPiece';
import PromotionModal from './PromotionModal';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function ChessBoard({ boardWrapperRef }) {
  const gameState       = useChessStore((s) => s.gameState);
  const selectedSquare  = useChessStore((s) => s.selectedSquare);
  const legalMoves      = useChessStore((s) => s.legalMoves);
  const promotionPending = useChessStore((s) => s.promotionPending);
  const lastMove        = useChessStore((s) => s.lastMove);
  const playerColor     = useChessStore((s) => s.playerColor);
  const showGuides      = useChessStore((s) => s.showGuides);
  const selectSquare    = useChessStore((s) => s.selectSquare);

  const board = gameState?.board;
  const flipped = playerColor === 'black';

  const [boardSize, setBoardSize] = useState(360);

  useEffect(() => {
    const el = boardWrapperRef?.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const vpCap = Math.min(window.innerWidth, window.innerHeight) - 160;
      const available = Math.min(width, height, vpCap) - 20;
      setBoardSize(Math.max(Math.min(Math.floor(available), 520), 200));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [boardWrapperRef]);

  const squareSize = boardSize / 8;
  const labelSize = Math.max(14, squareSize * 0.28);

  const displayRows = useMemo(
    () => (flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()]),
    [flipped],
  );
  const displayCols = useMemo(
    () => (flipped ? [...Array(8).keys()].reverse() : [...Array(8).keys()]),
    [flipped],
  );

  const isSelected = (r, c) =>
    selectedSquare?.row === r && selectedSquare?.col === c;

  const isLegalTarget = (r, c) =>
    legalMoves.some((m) => m.row === r && m.col === c);

  const isLastMove = (r, c) =>
    (lastMove?.from.row === r && lastMove?.from.col === c) ||
    (lastMove?.to.row === r && lastMove?.to.col === c);

  const isKingInCheck = (r, c) => {
    const piece = board?.[r]?.[c];
    return (
      piece?.type === 'king' &&
      piece.color === gameState?.currentTurn &&
      gameState?.status === 'check'
    );
  };

  if (!board) return null;

  return (
    <div className="board-frame relative flex flex-col items-center">
      <div className="flex">
        {/* Rank labels (left) */}
        <div className="flex flex-col">
          {displayRows.map((r) => (
            <div
              key={r}
              className="flex items-center justify-center font-cinzel text-alabaster/50 select-none"
              style={{ width: labelSize, height: squareSize, fontSize: Math.max(9, squareSize * 0.18) }}
            >
              {RANKS[r]}
            </div>
          ))}
        </div>

        {/* Board */}
        <div
          className="relative rounded-sm overflow-hidden"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(197,160,89,0.18)' }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(8, ${squareSize}px)`,
              gridTemplateRows: `repeat(8, ${squareSize}px)`,
            }}
          >
            {displayRows.map((row) =>
              displayCols.map((col) => {
                const isLight = (row + col) % 2 === 0;
                const piece = board[row][col];
                const selected = isSelected(row, col);
                const legal = showGuides && isLegalTarget(row, col);
                const lastMv = isLastMove(row, col);
                const inCheck = isKingInCheck(row, col);
                const hasPiece = !!piece;

                let bg;
                if (selected) {
                  bg = 'rgba(197, 160, 89, 0.45)';
                } else if (inCheck) {
                  bg = 'rgba(180, 40, 50, 0.65)';
                } else if (lastMv) {
                  bg = isLight ? 'rgba(197, 160, 89, 0.25)' : 'rgba(197, 160, 89, 0.30)';
                } else {
                  bg = isLight ? '#F0D9B5' : '#8B4513';
                }

                const grain = isLight
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.03) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)';

                return (
                  <div
                    key={`${row}-${col}`}
                    className="relative flex items-center justify-center cursor-pointer transition-colors duration-100"
                    style={{
                      width: squareSize,
                      height: squareSize,
                      backgroundColor: bg,
                      backgroundImage: selected || inCheck || lastMv ? 'none' : grain,
                    }}
                    onClick={() => selectSquare({ row, col })}
                  >
                    {/* Legal-move indicator */}
                    {legal &&
                      (hasPiece ? (
                        <div
                          className="absolute inset-0 z-10 pointer-events-none rounded-sm"
                          style={{
                            background:
                              'radial-gradient(circle, transparent 60%, rgba(197,160,89,0.50) 61%)',
                          }}
                        />
                      ) : (
                        <div
                          className="absolute z-10 pointer-events-none rounded-full"
                          style={{
                            width: squareSize * 0.3,
                            height: squareSize * 0.3,
                            backgroundColor: 'rgba(197, 160, 89, 0.55)',
                          }}
                        />
                      ))}

                    {/* Piece */}
                    {piece && (
                      <div
                        className={`relative z-20 transition-transform duration-100 ${
                          selected ? 'scale-110' : 'hover:scale-105'
                        }`}
                      >
                        <ChessPiece
                          type={piece.type}
                          color={piece.color}
                          size={Math.max(20, squareSize * 0.72)}
                        />
                      </div>
                    )}
                  </div>
                );
              }),
            )}
          </div>

          {/* Promotion modal */}
          {promotionPending && <PromotionModal />}
        </div>

        {/* Spacer */}
        <div style={{ width: labelSize }} />
      </div>

      {/* File labels (bottom) */}
      <div className="flex" style={{ marginLeft: labelSize }}>
        {displayCols.map((c) => (
          <div
            key={c}
            className="flex items-center justify-center font-cinzel text-alabaster/50 select-none"
            style={{ width: squareSize, height: labelSize, fontSize: Math.max(9, squareSize * 0.18) }}
          >
            {FILES[c]}
          </div>
        ))}
      </div>
    </div>
  );
}
