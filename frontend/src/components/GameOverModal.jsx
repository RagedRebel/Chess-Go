import LaurelWreath from './LaurelWreath';

export default function GameOverModal({ result, method, playerColor, onClose }) {
  const isWinner = result === playerColor;
  const isDraw = result === 'draw';

  let title = 'Draw';
  let subtitle = '';

  if (isDraw) {
    title = 'Draw';
    subtitle = formatMethod(method);
  } else if (isWinner) {
    title = 'Victory';
    subtitle = formatMethod(method);
  } else {
    title = 'Defeat';
    subtitle = formatMethod(method);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative bg-alabaster border-2 border-gold/50 rounded-lg shadow-stone-lg
                    px-10 py-10 max-w-sm w-full mx-4 text-center animate-slide-up"
      >
        {/* Laurel Wreath Frame */}
        <div className="flex justify-center mb-4">
          <LaurelWreath className="w-20 h-20 text-gold" />
        </div>

        {/* Result Icon */}
        <div className="text-5xl mb-3">
          {isDraw ? '⚖' : isWinner ? '♔' : '♚'}
        </div>

        {/* Title */}
        <h2 className="font-cinzel text-3xl font-bold text-navy tracking-wider mb-1">
          {title}
        </h2>

        {/* Subtitle / Method */}
        <p className="font-playfair text-stone-gray italic text-sm mb-6">
          {subtitle}
        </p>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="block w-12 h-px bg-gold/40" />
          <span className="text-gold text-xs">✦</span>
          <span className="block w-12 h-px bg-gold/40" />
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="stone-btn text-sm">
          Return to Lobby
        </button>
      </div>
    </div>
  );
}

function formatMethod(method) {
  const labels = {
    checkmate: 'By Checkmate',
    stalemate: 'By Stalemate',
    insufficient_material: 'Insufficient Material',
    threefold_repetition: 'Threefold Repetition',
    fifty_move_rule: 'Fifty-Move Rule',
  };
  return labels[method] || method || '';
}
