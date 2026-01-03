// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // ❌ แก้จาก sport เป็น sans
        // sport: ['"Kanit"', 'sans-serif'],

        // ✅ เปลี่ยนเป็นแบบนี้ครับ (เพื่อให้เป็น Default ของทั้งเว็บ)
        sans: ['"Kanit"', "sans-serif"],

        cute: ['"Mali"', "cursive"],
        vintage: ['"Chonburi"', "serif"],
      },
    },
  },
  plugins: [],
};
