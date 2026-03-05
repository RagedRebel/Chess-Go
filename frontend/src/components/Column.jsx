/**
 * Decorative Ionic / Corinthian column SVG.
 * Rendered on either side of the chessboard.
 */
export default function Column({ side = 'left' }) {
  const mirror = side === 'right' ? 'scale(-1, 1)' : '';

  return (
    <svg
      width="56"
      height="420"
      viewBox="0 0 56 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-50 select-none"
      aria-hidden="true"
      style={{ transform: mirror }}
    >
      {/* === Capital (Ionic volutes) === */}
      {/* Left volute */}
      <path
        d="M8 40 C8 28, 14 22, 20 22 C26 22, 28 28, 24 32 C20 36, 14 34, 14 30"
        stroke="#C5A059"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Right volute */}
      <path
        d="M48 40 C48 28, 42 22, 36 22 C30 22, 28 28, 32 32 C36 36, 42 34, 42 30"
        stroke="#C5A059"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Abacus (top slab) */}
      <rect x="4" y="14" width="48" height="6" rx="1" fill="#4A4235" />
      {/* Echinus (curved element below abacus) */}
      <path
        d="M10 20 Q28 26 46 20"
        stroke="#6A5C48"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Capital band */}
      <rect x="10" y="38" width="36" height="4" rx="1" fill="#4A4235" />

      {/* === Shaft === */}
      <rect x="14" y="42" width="28" height="340" rx="1" fill="#2A2418" />

      {/* Fluting lines */}
      {[18, 22, 26, 30, 34, 38].map((x) => (
        <line
          key={x}
          x1={x}
          y1="46"
          x2={x}
          y2="378"
          stroke="#C5A059"
          strokeWidth="0.5"
          opacity="0.3"
        />
      ))}

      {/* Entasis (subtle bulge highlight on shaft) */}
      <path
        d="M14 42 Q12 210 14 382"
        stroke="#C5A059"
        strokeWidth="0.5"
        fill="none"
        opacity="0.25"
      />

      {/* === Base === */}
      {/* Torus (upper base ring) */}
      <rect x="10" y="382" width="36" height="5" rx="2" fill="#4A4235" />
      {/* Scotia (concave molding) */}
      <path
        d="M12 387 Q28 393 44 387"
        stroke="#6A5C48"
        strokeWidth="1"
        fill="none"
      />
      {/* Lower torus */}
      <rect x="8" y="392" width="40" height="5" rx="2" fill="#4A4235" />
      {/* Plinth */}
      <rect x="4" y="397" width="48" height="8" rx="1" fill="#3A3428" />

      {/* Decorative acanthus leaf at capital */}
      <path
        d="M28 38 L24 30 Q28 26 32 30 Z"
        fill="#C5A059"
        opacity="0.5"
      />
      <path
        d="M28 38 L22 34 Q24 28 28 32 Z"
        fill="#A8893A"
        opacity="0.35"
      />
      <path
        d="M28 38 L34 34 Q32 28 28 32 Z"
        fill="#A8893A"
        opacity="0.35"
      />
    </svg>
  );
}
