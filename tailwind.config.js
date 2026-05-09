/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./public/**/*.{html,js}"
    ],
    theme: {
      extend: {
        colors: {
          primary: '#10B981', // Emerald yashil
          primaryHover: '#059669', // To'q yashil
          darkBg: '#0F172A', // Asosiy qora fon
          darkCard: '#1E293B', // Kartalar uchun ochroq qora
          darkBorder: '#334155', // Chiziqlar uchun
          lightText: '#F8FAFC', // Oq matn
          grayText: '#94A3B8' // Kulrang matn
        }
      },
    },
    plugins: [],
  }