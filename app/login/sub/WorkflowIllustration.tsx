export function WorkflowIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="wfNodeBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="wfFlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <filter id="wfShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Curved flow line */}
      <path
        d="M 35 95 C 70 95 90 25 130 35 C 165 43 180 75 165 95"
        stroke="url(#wfFlow)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Node 1 - 3D pill shape */}
      <g filter="url(#wfShadow)">
        <ellipse cx="35" cy="95" rx="14" ry="5" fill="#0f172a" opacity="0.25" />
        <rect x="21" y="70" width="28" height="25" rx="4" fill="url(#wfNodeBlue)" />
        <ellipse cx="35" cy="70" rx="14" ry="5" fill="#93c5fd" />
      </g>

      {/* Node 2 */}
      <g filter="url(#wfShadow)">
        <ellipse cx="130" cy="35" rx="14" ry="5" fill="#0f172a" opacity="0.25" />
        <rect x="116" y="10" width="28" height="25" rx="4" fill="url(#wfNodeBlue)" />
        <ellipse cx="130" cy="10" rx="14" ry="5" fill="#93c5fd" />
      </g>

      {/* Node 3 */}
      <g filter="url(#wfShadow)">
        <ellipse cx="165" cy="95" rx="14" ry="5" fill="#0f172a" opacity="0.25" />
        <rect x="151" y="70" width="28" height="25" rx="4" fill="url(#wfNodeBlue)" />
        <ellipse cx="165" cy="70" rx="14" ry="5" fill="#93c5fd" />
      </g>

      {/* Flow arrows */}
      <polygon points="75,65 88,65 82,55" fill="#2563eb" opacity="0.9" />
      <polygon points="155,75 168,75 162,85" fill="#2563eb" opacity="0.9" />
    </svg>
  );
}
