/**
 * ChessPiece — renders a Unicode chess symbol.
 *
 * Props
 *   type  : 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'
 *   color : 'white' | 'black'
 *   size  : font-size in px (default 42)
 */

const PIECES = {
  white: { king: '\u2654', queen: '\u2655', rook: '\u2656', bishop: '\u2657', knight: '\u2658', pawn: '\u2659' },
  black: { king: '\u265A', queen: '\u265B', rook: '\u265C', bishop: '\u265D', knight: '\u265E', pawn: '\u265F' },
};

export default function ChessPiece({ type, color, size = 42 }) {
  const symbol = PIECES[color]?.[type];
  if (!symbol) return null;

  const isWhite = color === 'white';

  return (
    <span
      className="select-none leading-none pointer-events-none"
      style={{
        fontSize: size,
        lineHeight: 1,
        display: 'block',
        color: isWhite ? '#FAF5EC' : '#1B2A4A',
        textShadow: isWhite
          ? '0 1px 3px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.8)'
          : '0 1px 3px rgba(0,0,0,0.35)',
        filter: isWhite
          ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))'
          : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
      }}
      aria-label={`${color} ${type}`}
    >
      {symbol}
    </span>
  );
}
