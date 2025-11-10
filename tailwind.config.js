/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- แก้ไข/เพิ่มบรรทัดนี้
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}