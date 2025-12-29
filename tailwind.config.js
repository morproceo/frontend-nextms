/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      // Apple + Tesla Design System Tokens
      colors: {
        // Neutral palette (Apple-inspired)
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F5F7',
          tertiary: '#E8E8ED',
          inverse: '#1D1D1F'
        },
        text: {
          primary: '#1D1D1F',
          secondary: '#6E6E73',
          tertiary: '#86868B',
          inverse: '#FFFFFF'
        },
        // Accent colors
        accent: {
          DEFAULT: '#0071E3',
          hover: '#0077ED',
          active: '#006EDB',
          muted: '#E8F4FD'
        },
        // Status colors
        success: {
          DEFAULT: '#34C759',
          muted: '#E8F9ED'
        },
        warning: {
          DEFAULT: '#FF9500',
          muted: '#FFF4E5'
        },
        error: {
          DEFAULT: '#FF3B30',
          muted: '#FFEBE9'
        },
        // Chart/data colors
        chart: {
          1: '#0071E3',
          2: '#5856D6',
          3: '#FF9500',
          4: '#34C759',
          5: '#FF3B30'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'title-sm': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['17px', { lineHeight: '1.5' }],
        'body-sm': ['15px', { lineHeight: '1.5' }],
        'caption': ['14px', { lineHeight: '1.4' }],
        'small': ['12px', { lineHeight: '1.3' }]
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'input': '10px',
        'chip': '8px',
        'tag': '6px'
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.12)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'modal': '0 24px 80px rgba(0, 0, 0, 0.2)',
        'button': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'input-focus': '0 0 0 4px rgba(0, 113, 227, 0.2)'
      },
      backdropBlur: {
        'glass': '20px'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      transitionDuration: {
        '250': '250ms'
      }
    }
  },
  plugins: []
};
