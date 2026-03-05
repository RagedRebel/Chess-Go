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
      className="opacity-30 select-none"
      aria-hidden="true"
      style={{ transform: mirror }}
    >
      {/* === Capital (Ionic volutes) === */}
      {/* Left volute */}
      <path
        d="M8 40 C8 28, 14 22, 20 22 C26 22, 28 28, 24 32 C20 36, 14 34, 14 30"
        stroke="#8C8C8C"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Right volute */}
      <path
        d="M48 40 C48 28, 42 22, 36 22 C30 22, 28 28, 32 32 C36 36, 42 34, 42 30"
        stroke="#8C8C8C"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Abacus (top slab) */}
      <rect x="4" y="14" width="48" height="6" rx="1" fill="#C8C0B4" />
      {/* Echinus (curved element below abacus) */}
      <path
        d="M10 20 Q28 26 46 20"
        stroke="#B0A898"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Capital band */}
      <rect x="10" y="38" width="36" height="4" rx="1" fill="#C8C0B4" />

      {/* === Shaft === */}
      <rect x="14" y="42" width="28" height="340" rx="1" fill="#D5CFC6" />

      {/* Fluting lines */}
      {[18, 22, 26, 30, 34, 38].map((x) => (
        <line
          key={x}
          x1={x}
          y1="46"
          x2={x}
          y2="378"
          stroke="#B8B0A4"
          strokeWidth="0.5"
          opacity="0.5"
        />
      ))}

      {/* Entasis (subtle bulge highlight on shaft) */}
      <path
        d="M14 42 Q12 210 14 382"
        stroke="#E0D8CC"
        strokeWidth="0.5"
        fill="none"
        opacity="0.4"
      />

      {/* === Base === */}
      {/* Torus (upper base ring) */}
      <rect x="10" y="382" width="36" height="5" rx="2" fill="#C8C0B4" />
      {/* Scotia (concave molding) */}
      <path
        d="M12 387 Q28 393 44 387"
        stroke="#A8A090"
        strokeWidth="1"
        fill="none"
      />
      {/* Lower torus */}
      <rect x="8" y="392" width="40" height="5" rx="2" fill="#C8C0B4" />
      {/* Plinth */}
      <rect x="4" y="397" width="48" height="8" rx="1" fill="#B8B0A4" />

      {/* Decorative acanthus leaf at capital */}
      <path
        d="M28 38 L24 30 Q28 26 32 30 Z"
        fill="#C8C0B4"
        opacity="0.6"
      />
      <path
        d="M28 38 L22 34 Q24 28 28 32 Z"
        fill="#B8B0A4"
        opacity="0.4"
      />
      <path
        d="M28 38 L34 34 Q32 28 28 32 Z"
        fill="#B8B0A4"
        opacity="0.4"
      />
    </svg>
  );
}
