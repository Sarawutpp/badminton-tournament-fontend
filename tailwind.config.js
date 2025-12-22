/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // เพิ่มส่วนนี้เข้าไปครับ
      fontFamily: {
        sport: ['"Kanit"', 'sans-serif'],      // ใช้สำหรับหัวข้อภาษาอังกฤษ หรือชื่อทีมที่อยากให้ดูแข็งแรง
        cute: ['"Mali"', 'cursive'],           // ใช้สำหรับชื่อเล่น หรือข้อความภาษาไทยแนวน่ารัก
        vintage: ['"Chonburi"', 'serif'],      // (ถ้าเลือกใช้) สำหรับหัวข้อ "ทำเนียบไก่"
      },
    },
  },
  plugins: [],
}