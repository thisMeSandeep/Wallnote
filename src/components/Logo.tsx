/**
 * The acorn stands in for the "o" in Wallnote. Its browns are deliberately the
 * cork tokens — #6b4522 is the corkboard frame and #c68f52 the cork surface —
 * so the mark belongs to the same world as the wall behind it.
 */
export function Acorn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {/* stalk */}
      <path d="M12 1.7v2" stroke="#5a3819" strokeWidth="1.7" strokeLinecap="round" />

      {/* nut */}
      <path
        d="M6.4 9.2c0 5.9 2.3 10.4 5.6 12.5 3.3-2.1 5.6-6.6 5.6-12.5z"
        fill="#c68f52"
      />
      <path
        d="M8.7 10.8c-.1 3.5.6 6.4 1.8 8.2"
        stroke="#fff"
        strokeOpacity=".28"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* cap */}
      <path
        d="M4.5 8.6C4.5 5.2 7.8 3.2 12 3.2s7.5 2 7.5 5.4c0 .9-.3 1.3-1.2 1.4-1.9.3-4 .45-6.3.45s-4.4-.15-6.3-.45c-.9-.1-1.2-.5-1.2-1.4z"
        fill="#6b4522"
      />
      {/* cap texture — reads as scoring at large sizes, vanishes at 16px */}
      <path
        d="M8.1 4.7L6.6 8.3M12 4v5.4M15.9 4.7l1.5 3.6"
        stroke="#a06a34"
        strokeOpacity=".5"
        strokeWidth=".9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="brand" aria-label="Wallnote">
      <span aria-hidden>Walln</span>
      <Acorn className="brand__acorn" />
      <span aria-hidden>te</span>
    </span>
  );
}
