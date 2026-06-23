/** @type {import('tailwindcss').Config} */
// AYRES • tema premium mapeado pro Tailwind.
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ay: {
          bg: '#0B0F19',
          bg2: '#0E1421',
          surface: '#121A2A',
          blue: '#3B82F6',
          'blue-soft': '#60A5FA',
          gold: '#E8B53C',
          'gold-soft': '#F4CD6B',
          text: '#EAF0FB',
          'text-2': '#A7B2C7',
          'text-3': '#6B7892',
          'st-semretorno': '#F4A33B',
          'st-negociacao': '#3B82F6',
          'st-docs': '#8B7CF6',
          'st-captado': '#34D399',
          'st-carregou': '#E8B53C',
          'st-naocarregou': '#F4587A',
        },
        ldc: {
          green: '#16a34a',
          orange: '#f59e0b',
          red: '#dc2626',
          blue: '#2563eb',
          purple: '#7c3aed',
          dark: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        ay: '16px',
        'ay-sm': '11px',
      },
      boxShadow: {
        ay: '0 18px 40px -18px rgba(0,0,0,.65)',
        'ay-soft': '0 8px 24px -14px rgba(0,0,0,.55)',
        'ay-blue': '0 0 30px -8px rgba(59,130,246,.35)',
        'ay-gold': '0 0 30px -8px rgba(232,181,60,.30)',
      },
      backdropBlur: {
        ay: '16px',
      },
      backgroundImage: {
        'ay-page': 'radial-gradient(1200px 700px at 12% -8%, rgba(59,130,246,.10), transparent 60%), radial-gradient(1000px 620px at 100% 0%, rgba(232,181,60,.08), transparent 55%)',
        'ay-blue-gold': 'linear-gradient(135deg, #3B82F6, #60A5FA)',
        'ay-gold-grad': 'linear-gradient(135deg, #E8B53C, #F4CD6B)',
      },
      transitionTimingFunction: {
        ay: 'cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
}
