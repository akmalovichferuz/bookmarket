const express = require('express');
const path = require('path');
const cors = require('cors');

// Swagger UI va Config fayllarini import qilish
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// API Marshrutlarini import qilish
const adminRoutes = require('./routes/adminRoutes'); 
const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const marketRoutes = require('./routes/marketRoutes');

const app = express();

// --- GLOBAL MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- STATIK FAYLLAR ---
// Yuklangan rasmlar uchun
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Barcha frontend fayllari (CSS, JS, HTML) uchun
app.use(express.static(path.join(__dirname, '../public')));

// --- SWAGGER API DOKUMENTATSIYASI ---
// Brauzerda http://localhost:5000/api-docs orqali kiriladi
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- API YO'NALISHLARI ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes); // .env orqali boshqariladigan Admin API
app.use('/api/market', marketRoutes);
app.use('/api/messages', require('./routes/messageRoutes'));

// --- ADMIN PANEL MARSHRUTLARI (URL orqali kirish) ---

/**
 * @route   GET /admin-login
 * @desc    Admin kirish sahifasini ko'rsatish
 */
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-login.html'));
});

/**
 * @route   GET /admin
 * @desc    Asosiy Admin Panel boshqaruv sahifasini ko'rsatish
 * Eslatma: Frontenddagi admin.js tokenni tekshirib, 
 * agar u bo'lmasa /admin-login ga yo'naltiradi.
 */
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// --- XATOLIKLARNI BOSHQARISH (Error Handling) ---
// 404 - Topilmagan sahifalar uchun (ixtiyoriy)
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Siz so'ragan resurs topilmadi!"
    });
});

// Umumiy xatoliklar uchun
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error(`[Xatolik]: ${err.message}`);
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Serverda ichki xatolik yuz berdi!'
    });
});

module.exports = app;