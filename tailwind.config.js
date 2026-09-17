/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /*
         * The surfaces and the foreground come from variables so the whole
         * interface can be light or dark. Brand blue and Space green do not
         * move: they mean something.
         */
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          raised: 'rgb(var(--ink-raised) / <alpha-value>)',
          card: 'rgb(var(--ink-card) / <alpha-value>)',
          hover: 'rgb(var(--ink-hover) / <alpha-value>)',
          line: 'rgb(var(--ink-line) / <alpha-value>)',
        },
        white: 'rgb(var(--fg) / <alpha-value>)',
        link: 'rgb(var(--link) / <alpha-value>)',
        /*
         * The bar and the rail. In the dark they are deep Kobbleston blue
         * with white on top; in daylight they are a pale blue with dark text,
         * the way the rest of the interface flips.
         */
        chrome: 'rgb(var(--chrome) / <alpha-value>)',
        onbrand: 'rgb(var(--on-chrome) / <alpha-value>)',
        brand: {
          DEFAULT: '#1B34E8',
          bright: '#3A50FF',
          deep: '#162382',
          ink: '#0d1349',
        },
        space: {
          DEFAULT: '#1CAE71',
          bright: '#25D68C',
          deep: '#14855a',
        },
        muted: 'rgb(var(--muted) / <alpha-value>)',
      },
      fontFamily: {
        display: ['bd-gravel-vf', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.8)',
        pop: '0 24px 60px -20px rgba(0,0,0,0.85)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 currentColor', opacity: '0.7' },
          '100%': { boxShadow: '0 0 0 7px transparent', opacity: '0' },
        },
        'ticker': { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(-50%)' } },
        'bob': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        'draw': { '0%': { strokeDashoffset: '1200' }, '100%': { strokeDashoffset: '0' } },
      },
      animation: {
        'pop-in': 'pop-in 180ms cubic-bezier(0.2,0.8,0.2,1) both',
        'slide-up': 'slide-up 420ms cubic-bezier(0.2,0.8,0.2,1) both',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        bob: 'bob 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
