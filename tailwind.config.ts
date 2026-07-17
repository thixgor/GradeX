import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        clinical: ['var(--font-clinical)', 'ui-monospace', 'monospace'],
        // Landing (rota '/'): carregadas com next/font só nessa rota.
        'da-display': ['var(--font-da-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'da-body': ['var(--font-da-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'da-mono': ['var(--font-da-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // DomineAqui brand colors
        'domina-green': '#468152',
        'domina-yellow': '#E2A43E',
        'domina-dark': '#153D1F',
        'domina-orange': '#CE5929',
        // Dashboard premium palette
        'navy': {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0a0f1a',
        },
        'emerald-academic': {
          DEFAULT: '#468152',
          light: '#5a9b6a',
          dark: '#2d5a3a',
          glow: 'rgba(70, 129, 82, 0.3)',
        },
        // Glassmorphism Irish palette (avaliações)
        'irish-emerald': '#0F8B5F',
        'irish-forest': '#0B5236',
        'irish-gold': '#F0C563',
        'irish-gold-soft': '#F7DE9C',
        // Landing (rota '/'). Escopo em `.da-landing` (globals.css), seguindo o
        // tema do site via next-themes. Canais RGB para os modificadores de
        // opacidade do Tailwind (bg-da-panel/40) funcionarem.
        'da-amber': 'rgb(var(--da-amber) / <alpha-value>)',
        'da-amber-lift': 'rgb(var(--da-amber-lift) / <alpha-value>)',
        'da-ground': 'rgb(var(--da-ground) / <alpha-value>)',
        'da-panel': 'rgb(var(--da-panel) / <alpha-value>)',
        'da-tint': 'rgb(var(--da-tint) / <alpha-value>)',
        'da-paper': 'rgb(var(--da-paper) / <alpha-value>)',
        'da-muted': 'rgb(var(--da-muted) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config
