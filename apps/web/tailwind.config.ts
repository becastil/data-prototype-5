import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Gallagher Brand Colors
        gallagher: {
          blue: '#00263E',
          'blue-light': '#003A5C',
          'blue-lighter': '#E6EEF2',
          orange: '#FF8400',
          'orange-light': '#FFF4E6',
        },
        // Semantic colors
        background: '#F9FAFB',
        'card-bg': '#FFFFFF',
        border: '#E5E7EB',
        // Text colors
        'text-primary': '#000000',
        'text-secondary': '#374151',
        'text-muted': '#6B7280',
        'text-light': '#9CA3AF',
        // Status colors (using Gallagher palette)
        status: {
          positive: '#00263E',
          'positive-bg': '#E6EEF2',
          warning: '#FF8400',
          'warning-bg': '#FFF4E6',
          neutral: '#6B7280',
          'neutral-bg': '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['Source Sans Pro', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'hero': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'metric': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'card-title': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
export default config
