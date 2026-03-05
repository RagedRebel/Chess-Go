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
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 rounded-sm">
      <div
        className="bg-gradient-to-b from-[#3a2a1a] to-[#2a1c10] border border-gold/40 rounded-xl p-4 shadow-2xl"
        style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
      >
        <p className="text-center font-cinzel text-xs uppercase tracking-widest text-gold/80 mb-3">
          Promote Pawn
        </p>
        <div className="flex gap-2">
          {PROMOTION_PIECES.map(({ type, notation, label }) => (
            <button
              key={notation}
              className="flex flex-col items-center justify-center w-16 h-16 rounded-lg
                         bg-[#4a3520] hover:bg-gold/20
                         border border-gold/20 hover:border-gold/60
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
