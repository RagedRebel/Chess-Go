import LaurelWreath from './LaurelWreath';

export default function PlayerInfo({ name, color, isActive, position }) {
  const pieceIcon = color === 'white' ? '♔' : '♚';

  return (
    <div
      className={`flex items-center gap-2 px-4 py-1.5 rounded transition-all duration-350 ease-dignified
        ${isActive
          ? 'bg-gold/10 border border-gold/40 shadow-gold-glow'
          : 'bg-navy/40 border border-white/5'
        }
        ${position === 'top' ? 'mb-0.5' : 'mt-0.5'}
      `}
    >
      <LaurelWreath className="w-5 h-5 text-gold/60 flex-shrink-0" />

      <span className="text-lg leading-none" aria-hidden="true">
        {pieceIcon}
      </span>

      <span className="font-cinzel text-xs font-semibold text-alabaster tracking-wide">
        {name}
      </span>
      <span className="font-garamond text-[10px] text-alabaster/50 capitalize">
        ({color})
      </span>

      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
      )}
    </div>
  );
}
