// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Path to your main HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // Paths to all JS, TS, JSX, TSX files in src
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.indigo, // Example: Indigo as primary
        secondary: colors.pink,
        neutral: colors.slate,
        success: colors.green,
        warning: colors.yellow,
        danger: colors.red,
        // Define shades for light/dark modes or hover/active states
        // primary: { DEFAULT: '#3B82F6', hover: '#2563EB', ... }
      },
      fontFamily: {
        // Add custom fonts if you have them
        // sans: ['Inter', 'sans-serif'],
      },
      // Extend spacing, breakpoints, etc. as needed
    },
  },

  plugins: [
    require('@tailwindcss/forms'), // For much better default form styling
    // require('@tailwindcss/typography'), // If you display rich text/markdown
    // require('@tailwindcss/aspect-ratio'),
  ],
}