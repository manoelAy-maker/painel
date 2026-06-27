export default function AyresLogo({ size = 42, showWord = false, className = '' }) {
  const w = showWord ? size * 3.45 : size

  return (
    <svg
      className={`ayres-logo-svg ${className}`}
      width={w}
      height={size}
      viewBox={showWord ? '0 0 248 92' : '0 0 92 92'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AYRES"
    >
      <defs>
        <linearGradient id="ayresAOriginal" x1="42" y1="4" x2="66" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#159BFF" />
          <stop offset="0.46" stopColor="#0756FF" />
          <stop offset="1" stopColor="#8D22F5" />
        </linearGradient>
        <linearGradient id="ayresADeep" x1="13" y1="82" x2="39" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#07155E" />
          <stop offset="0.58" stopColor="#0834CF" />
          <stop offset="1" stopColor="#129DFF" />
        </linearGradient>
        <linearGradient id="ayresRoad" x1="10" y1="66" x2="76" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.62" stopColor="#F8FBFF" />
          <stop offset="1" stopColor="#DDEBFF" />
        </linearGradient>
        <linearGradient id="ayresWord" x1="2" y1="79" x2="240" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#DDE7FF" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <filter id="ayresLogoGlow" x="-20" y="-18" width="132" height="130" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.05 0 0 0 0 0.34 0 0 0 0 1 0 0 0 .38 0" />
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>

      <g filter="url(#ayresLogoGlow)">
        <path d="M46 5.4L84.6 86H66.8L51.4 54.2L43.2 69.1H31.1L46 40.4L20 86H7.4L46 5.4Z" fill="url(#ayresAOriginal)" />
        <path d="M46 5.4L22.2 86H7.4L46 5.4Z" fill="url(#ayresADeep)" opacity=".96" />
        <path d="M52.2 20.8L84.6 86H66.8L51.4 54.2L43.2 69.1H31.1L52.2 20.8Z" fill="url(#ayresAOriginal)" opacity=".88" />
        <path d="M46.2 36.2L56.9 58.8H35.4L46.2 36.2Z" fill="#FFFFFF" opacity=".98" />

        <path d="M9.8 74.2C25.7 55.9 47 44.2 73.6 39.2L68.2 47.4C47.8 51.2 29.4 61.2 12.4 77.1L9.8 74.2Z" fill="url(#ayresRoad)" />
        <path d="M62.8 34.9L84.8 45.4L65.9 59.8L69.2 49.5C45.6 55.2 26.5 65.2 12.4 79.3C27.8 59 47.2 45.2 70.5 37.8L62.8 34.9Z" fill="#FFFFFF" />
        <path d="M30.5 69.4C38.4 60.4 47.6 54.3 58.2 51" stroke="#1E46EA" strokeWidth="4.2" strokeLinecap="round" strokeDasharray="8 7" opacity=".82" />
      </g>

      {showWord && (
        <g transform="translate(2 0)">
          <g transform="translate(100 61)" fill="url(#ayresWord)">
            <path d="M0 21.5L13.7 0H24.9L38.6 21.5H28.5L25.9 17H12.3L9.7 21.5H0ZM15.5 10.8H22.6L19 4.6L15.5 10.8Z" />
            <path d="M48.4 21.5V13.7L34.7 0H45.9L53.3 7.6L60.8 0H71.4L57.9 13.7V21.5H48.4Z" />
            <path d="M78.9 21.5V0H101.5C106.5 0 110.1 1 112.2 3C113.8 4.5 114.6 6.5 114.6 9.1C114.6 12.5 113.1 14.9 110.1 16.3L116.2 21.5H104.7L99.8 17.1H88.3V21.5H78.9ZM88.3 10.9H99.6C101.5 10.9 102.8 10.7 103.5 10.2C104.1 9.8 104.4 9.2 104.4 8.4C104.4 7.5 104.1 6.9 103.5 6.5C102.8 6 101.5 5.8 99.6 5.8H88.3V10.9Z" />
            <path d="M123.6 21.5V0H155.1V5.8H133V8.2H153.1V13.1H133V15.7H155.6V21.5H123.6Z" />
            <path d="M164.3 21.5V15.6H184.2C185.2 15.6 185.9 15.5 186.3 15.2C186.7 15 186.9 14.6 186.9 14.1C186.9 13.1 186 12.6 184.3 12.6H174.4C167.3 12.6 163.8 10.5 163.8 6.3C163.8 2.1 167.5 0 174.9 0H195.4V5.9H176.5C174.9 5.9 174.1 6.3 174.1 7.2C174.1 8.1 174.9 8.5 176.6 8.5H186.5C193.7 8.5 197.3 10.7 197.3 15.1C197.3 19.4 193.7 21.5 186.4 21.5H164.3Z" />
          </g>
          <text x="101" y="91" fill="#AFC4F7" fontSize="8" fontWeight="800" letterSpacing="5.8">LOGISTICA INTELIGENTE</text>
        </g>
      )}
    </svg>
  )
}
