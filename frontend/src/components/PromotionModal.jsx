/**
 * PromotionModal — overlay shown when a pawn reaches the promotion rank.
 * Reads state from the Zustand store.
 */
import { useChessStore } from '../chess/useChessStore';
import ChessPiece from './ChessPiece';

const PROMOTION_PIECES = [
  { type: 'queen',  notation: 'q', label: 'Queen' },
  { type: 'rook',   notation: 'r', label: 'Rook' },
  { type: 'bishop', notation: 'b', label: 'Bishop' },
  { type: 'knight', notation: 'n', label: 'Knight' },
];

export default function PromotionModal() {
  const completePromotion = useChessStore((s) => s.completePromotion);
  const color = useChessStore((s) => s.gameState?.currentTurn ?? 'white');

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/55 rounded-sm">
      <div
        className="bg-navy border border-gold/40 rounded-xl p-4 shadow-2xl"
        style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 20px rgba(197,160,89,0.1)' }}
      >
        <p className="text-center font-cinzel text-xs uppercase tracking-widest text-gold/80 mb-3">
          Promote Pawn
        </p>
        <div className="flex gap-2">
          {PROMOTION_PIECES.map(({ type, notation, label }) => (
            <button
              key={notation}
              className="flex flex-col items-center justify-center w-16 h-16 rounded-lg
                         bg-navy hover:bg-gold/15
                         border border-gold/25 hover:border-gold/70
                         transition-all duration-200 cursor-pointer"
              onClick={() => completePromotion(notation)}
              title={label}
            >
              <ChessPiece type={type} color={color} size={36} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
