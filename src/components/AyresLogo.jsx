export default function AyresLogo({ size = 42, showWord = false, className = '' }) {
  const w = showWord ? size * 3.1 : size
  return (
    <svg
      className={`ayres-logo-svg ${className}`}
      width={w}
      height={size}
      viewBox={showWord ? '0 0 180 64' : '0 0 64 64'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AYRES"
    >
      <defs>
        <linearGradient id="ayresA" x1="14" y1="8" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#19A7FF" />
          <stop offset="0.52" stopColor="#2563EB" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="ayresRoad" x1="8" y1="50" x2="56" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#EAF6FF" />
          <stop offset="0.6" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCEBFF" />
        </linearGradient>
        <linearGradient id="ayresText" x1="76" y1="20" x2="174" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#EAF2FF" />
          <stop offset="1" stopColor="#A5B4FC" />
        </linearGradient>
        <filter id="ayresGlow" x="-18" y="-18" width="100" height="100" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.22 0 0 0 0 0.47 0 0 0 0 1 0 0 0 .38 0" />
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>

      <g filter="url(#ayresGlow)">
        <path d="M31.9 5.5c1.7 0 3.2.96 4.02 2.46l21.1 40.76c1.55 3-.6 6.58-3.98 6.58h-8.08L32.02 29.68 19.4 55.3H11.05c-3.37 0-5.54-3.58-3.98-6.58L27.9 7.96A4.53 4.53 0 0131.9 5.5z" fill="url(#ayresA)" />
        <path d="M13.6 47.9c11.2-11.02 25.38-18.62 42.72-22.9l-4.25 5.64c-14.82 3.42-27.55 9.94-38.47 19.94v-2.68z" fill="url(#ayresRoad)" />
        <path d="M47.65 23.26l9.92 5.42-9.1 6.68 1.6-5.02c-9.88 1.8-19.25 5.5-28.1 11.16 7.72-8.16 16.85-14.08 27.42-17.77l-1.74-.47z" fill="white" />
        <path d="M25.3 42.7c6.24-3.75 13.02-6.62 20.33-8.58" stroke="#1D4ED8" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 5" opacity=".8" />
      </g>

      {showWord && (
        <g fill="url(#ayresText)">
          <path d="M80.8 45h-5.2l11.6-26h5.2l11.6 26h-5.4l-2.42-5.7H83.24L80.8 45zm4.26-10.05h9.3L89.7 24.1l-4.64 10.85z" />
          <path d="M111.7 45V34.9L101.5 19h5.9l7.05 11.2L121.6 19h5.7l-10.35 15.9V45h-5.25z" />
          <path d="M131.6 45V19h13.2c3.2 0 5.7.75 7.46 2.24 1.76 1.5 2.64 3.6 2.64 6.3 0 2.03-.48 3.72-1.44 5.05-.96 1.32-2.33 2.28-4.1 2.87l6.1 9.54h-5.95l-5.43-8.78h-7.22V45h-5.26zm5.26-13.2h7.52c1.7 0 2.98-.34 3.82-1.03.84-.68 1.26-1.7 1.26-3.05 0-1.32-.42-2.32-1.26-3-.84-.68-2.12-1.02-3.82-1.02h-7.52v8.1z" />
          <path d="M162.7 45V19h20.1v4.62h-14.85v5.76h13.15v4.42h-13.15v6.58h15.3V45H162.7z" />
        </g>
      )}
    </svg>
  )
}
