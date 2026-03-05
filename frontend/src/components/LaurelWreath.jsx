/**
 * SVG Laurel Wreath — neoclassical decorative motif.
 * Used to frame player names and in the victory modal.
 */
export default function LaurelWreath({ className = '' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left branch */}
      <g opacity="0.85">
        {/* Main stem */}
        <path
          d="M50 90 Q30 70 22 50 Q16 34 20 18"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
        {/* Leaves — left side */}
        <ellipse cx="22" cy="24" rx="5" ry="2.5" transform="rotate(-50 22 24)" fill="currentColor" opacity="0.7" />
        <ellipse cx="20" cy="32" rx="5.5" ry="2.5" transform="rotate(-40 20 32)" fill="currentColor" opacity="0.75" />
        <ellipse cx="19" cy="40" rx="6" ry="2.5" transform="rotate(-30 19 40)" fill="currentColor" opacity="0.8" />
        <ellipse cx="21" cy="48" rx="6" ry="2.5" transform="rotate(-20 21 48)" fill="currentColor" opacity="0.8" />
        <ellipse cx="24" cy="55" rx="6" ry="2.5" transform="rotate(-10 24 55)" fill="currentColor" opacity="0.75" />
        <ellipse cx="28" cy="62" rx="5.5" ry="2.5" transform="rotate(0 28 62)" fill="currentColor" opacity="0.7" />
        <ellipse cx="33" cy="68" rx="5" ry="2.5" transform="rotate(10 33 68)" fill="currentColor" opacity="0.65" />
        <ellipse cx="39" cy="74" rx="5" ry="2.5" transform="rotate(20 39 74)" fill="currentColor" opacity="0.6" />
        <ellipse cx="44" cy="80" rx="4.5" ry="2.2" transform="rotate(30 44 80)" fill="currentColor" opacity="0.55" />
      </g>

      {/* Right branch (mirrored) */}
      <g opacity="0.85" transform="scale(-1,1) translate(-100,0)">
        <path
          d="M50 90 Q30 70 22 50 Q16 34 20 18"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
        <ellipse cx="22" cy="24" rx="5" ry="2.5" transform="rotate(-50 22 24)" fill="currentColor" opacity="0.7" />
        <ellipse cx="20" cy="32" rx="5.5" ry="2.5" transform="rotate(-40 20 32)" fill="currentColor" opacity="0.75" />
        <ellipse cx="19" cy="40" rx="6" ry="2.5" transform="rotate(-30 19 40)" fill="currentColor" opacity="0.8" />
        <ellipse cx="21" cy="48" rx="6" ry="2.5" transform="rotate(-20 21 48)" fill="currentColor" opacity="0.8" />
        <ellipse cx="24" cy="55" rx="6" ry="2.5" transform="rotate(-10 24 55)" fill="currentColor" opacity="0.75" />
        <ellipse cx="28" cy="62" rx="5.5" ry="2.5" transform="rotate(0 28 62)" fill="currentColor" opacity="0.7" />
        <ellipse cx="33" cy="68" rx="5" ry="2.5" transform="rotate(10 33 68)" fill="currentColor" opacity="0.65" />
        <ellipse cx="39" cy="74" rx="5" ry="2.5" transform="rotate(20 39 74)" fill="currentColor" opacity="0.6" />
        <ellipse cx="44" cy="80" rx="4.5" ry="2.2" transform="rotate(30 44 80)" fill="currentColor" opacity="0.55" />
      </g>

      {/* Ribbon at base */}
      <path
        d="M44 88 Q50 94 56 88"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M42 90 L44 96"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M58 90 L56 96"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
}
