/**
 * The diagonal out-arrow. Shared by every control that hands one arrow off to another on
 * hover — the pair sit in the same box and swap places, so both must be the same glyph.
 */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M7 17 L17 7 M9 7 H17 V15"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="square"
      />
    </svg>
  );
}
