import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tmk: {
          red: '#DC2626',
          'red-hover': '#EF4444',
          'red-dark': '#B91C1C',
          black: '#000000',
          dark: '#0A0A0A',
          'gray-900': '#171717',
          'gray-800': '#262626',
          'gray-700': '#404040',
          'gray-400': '#A3A3A3',
        }
      },
      fontFamily: {
        heading: ['var(--font-nunito)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
