import LaurelWreath from './LaurelWreath';

const PIECE_ORDER = ['queen', 'rook', 'bishop', 'knight', 'pawn'];
const PIECE_VALUES = { queen: 9, rook: 5, bishop: 3, knight: 3, pawn: 1 };
const PIECE_SYMBOLS = {
  white: { queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
  black: { queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' },
};

export default function PlayerInfo({ name, color, isActive, started, position, captured }) {
  const capturedIconColor = color === 'white' ? 'black' : 'white';
  const pieceIcon = color === 'white' ? '♔' : '♚';

  const capturedIcons = [];
  let materialGain = 0;
  if (captured) {
    for (const type of PIECE_ORDER) {
      const count = captured[type] || 0;
      materialGain += count * (PIECE_VALUES[type] || 0);
      for (let i = 0; i < count; i++) {
        capturedIcons.push(PIECE_SYMBOLS[capturedIconColor][type]);
      }
    }
  }
  const hasCaptured = capturedIcons.length > 0;
  const showTurnState = started && !isActive; // game in progress but not their turn

  return (
    <div
      className={`relative flex flex-col rounded overflow-hidden transition-all duration-300 ease-dignified
        ${position === 'top' ? 'mb-0.5' : 'mt-0.5'}
        ${isActive
          ? 'bg-gold/[0.12] border border-gold/50 shadow-gold-glow'
          : showTurnState
            ? 'bg-navy/30 border border-white/5 opacity-60'
            : 'bg-navy/40 border border-white/5'
        }
      `}
    >
      {/* ── Active accent bar (left edge) ── */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l transition-all duration-300
          ${isActive ? 'bg-gold' : 'bg-transparent'}
        `}
      />

      <div className="pl-4 pr-3 py-1.5">
        {/* ── Name row ── */}
        <div className="flex items-center gap-2">
          <LaurelWreath className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${isActive ? 'text-gold' : 'text-gold/40'}`} />

          <span className={`text-lg leading-none transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`} aria-hidden="true">
            {pieceIcon}
          </span>

          <span className={`font-cinzel text-xs font-semibold tracking-wide transition-colors duration-300 ${isActive ? 'text-alabaster' : 'text-alabaster/60'}`}>
            {name}
          </span>
          <span className="font-garamond text-[10px] text-alabaster/40 capitalize">
            ({color})
          </span>

          {materialGain > 0 && (
            <span className="font-cinzel text-[10px] text-gold/80">
              +{materialGain}
            </span>
          )}

          {/* Turn badge */}
          {isActive && started && (
            <span className="ml-auto flex items-center gap-1.5">
              <span className="font-cinzel text-[9px] uppercase tracking-widest text-gold/90">
                To Move
              </span>
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_6px_2px_rgba(197,160,89,0.6)]" />
            </span>
          )}
        </div>

        {/* ── Captured pieces row ── */}
        {hasCaptured && (
          <div
            className="flex flex-wrap items-center mt-0.5 ml-7 gap-x-0"
            style={{ lineHeight: 1, letterSpacing: '-1px' }}
          >
            {capturedIcons.map((sym, i) => (
              <span
                key={i}
                className="select-none"
                style={{
                  fontSize: 14,
                  color: capturedIconColor === 'white' ? '#E8E2D6' : '#1a1212',
                  textShadow:
                    capturedIconColor === 'white'
                      ? '0 1px 2px rgba(0,0,0,0.7)'
                      : '0 1px 2px rgba(0,0,0,0.25)',
                }}
              >
                {sym}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
