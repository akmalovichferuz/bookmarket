require('dotenv').config();
const http = require('http');
const fs = require('fs'); // YANGLIK: Fayl tizimi bilan ishlash uchun
const path = require('path'); // YANGLIK: Yo'llarni aniqlash uchun
const app = require('./src/app');
const connectDB = require('./src/config/db');

// =========================================================
// YANGLIK: UPLOADS PAPKASINI AVTOMAT YARATISH
// =========================================================
const uploadPath = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log('📁 "public/uploads" papkasi avtomatik ravishda yaratildi.');
}

// .env fayldan Admin ma'lumotlarini tekshirish (Xatolik bo'lmasligi uchun)
if (!process.env.ADMIN_LOGIN || !process.env.ADMIN_PASSWORD) {
    console.warn("DIQQAT: .env faylida ADMIN_LOGIN yoki ADMIN_PASSWORD topilmadi!");
}

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Ma'lumotlar bazasiga ulanish va serverni yoqish
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log('---------------------------------------------------------');
        console.log(`🚀 Server muvaffaqiyatli ishga tushdi (Port: ${PORT})`);
        console.log(`💻 Lokal kompyuter uchun URL: http://localhost:${PORT}`);
        console.log(`🌍 Railway tarmog'ida: Railway taqdim etgan domen orqali kiring`);
        console.log('---------------------------------------------------------');
    });
}).catch((err) => {
    console.error("❌ Serverni ishga tushirishda xatolik yuz berdi:", err.message);
    process.exit(1); // Xato bo'lsa jarayonni to'xtatish
});