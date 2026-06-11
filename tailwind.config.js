/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      }
    },
    extend: {
      colors: {
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD8',
          200: '#FFD9B0',
          300: '#FFC080',
          400: '#FFA352',
          500: '#FF8A3D',
          600: '#F57026',
          700: '#D95A18',
          800: '#B84910',
        },
        secondary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#4ECDC4',
          600: '#0D9488',
          700: '#0F766E',
        },
        warm: {
          50: '#FFF9F0',
          100: '#F5EFE6',
          200: '#E8DFD0',
          300: '#D4C4A8',
          400: '#B8A68A',
          700: '#4A3728',
          800: '#3D2D21',
          900: '#2A1E16',
        }
      },
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', '"Noto Sans SC"', 'cursive', 'sans-serif'],
        body: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(255, 138, 61, 0.15)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'hover': '0 12px 40px rgba(255, 138, 61, 0.25)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
};
