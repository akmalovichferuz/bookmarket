require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');

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
        console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
        console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
        console.log(`📄 Swagger: http://localhost:${PORT}/api-docs`);
        console.log('---------------------------------------------------------');
    });
}).catch((err) => {
    console.error("❌ Serverni ishga tushirishda xatolik yuz berdi:", err.message);
    process.exit(1); // Xato bo'lsa jarayonni to'xtatish
});