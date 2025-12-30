/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/hooks/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Tajawal"', '"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // نظام الألوان الموحد: سماوي فاتح، سماوي غامق، أسود، أبيض
        sky: {
          50: "#f0f9ff",   // سماوي فاتح جداً
          100: "#e0f2fe", // سماوي فاتح
          200: "#bae6fd", // سماوي فاتح متوسط
          300: "#7dd3fc", // سماوي متوسط
          400: "#38bdf8", // سماوي
          500: "#0ea5e9", // سماوي قوي
          600: "#0284c7", // سماوي غامق
          700: "#0369a1", // سماوي غامق جداً
          800: "#075985", // سماوي داكن
          900: "#0c4a6e", // سماوي داكن جداً
        },
        dark: {
          DEFAULT: "#0f172a", // slate-900 - أسود
          light: "#1e293b",   // slate-800
          lighter: "#334155",  // slate-700
        },
        light: {
          DEFAULT: "#ffffff",  // أبيض
          gray: "#f8fafc",     // slate-50
        },
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "2rem",
          xl: "2.5rem",
          "2xl": "3rem",
        },
      },
    },
  },
  darkMode: ["class", 'selector([data-theme="dark"] &)'],
};










