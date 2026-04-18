import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          dark: '#043249',
          gold: '#feb71b',
        },
        primary: {
          '50': '#e6f0f5',
          '100': '#cce1eb',
          '200': '#99c3d7',
          '300': '#66a5c3',
          '400': '#3387af',
          '500': '#043249',
          '600': '#032a3d',
          '700': '#022131',
          '800': '#021925',
          '900': '#011019',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        accent: {
          '50': '#fff9e6',
          '100': '#fef3cc',
          '200': '#fde799',
          '300': '#fcdb66',
          '400': '#fbcf33',
          '500': '#feb71b',
          '600': '#cb9216',
          '700': '#986e10',
          '800': '#66490b',
          '900': '#332505',
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        success: {
          '50': '#f0fdf4',
          '500': '#22c55e',
          '700': '#15803d'
        },
        warning: {
          '50': '#fffbeb',
          '500': '#f59e0b',
          '700': '#b45309'
        },
        danger: {
          '50': '#fef2f2',
          '500': '#ef4444',
          '700': '#b91c1c'
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
