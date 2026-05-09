const express = require('express');
const router = express.Router();

// 1. Kontrollerlarni import qilish
const { 
    adminLogin, 
    getDashboardData, 
    getUserFullDetails, 
    adminAdvancedSearch, 
    getAdminBook, 
    updateAdminBook, 
    deleteEverything 
} = require('../controllers/adminController');

// 2. Admin uchun maxsus himoya middleware'ini import qilish
// DIQQAT: Papka nomi sening loyihangda 'middlewares' bo'lsa, shu yo'l to'g'ri.
const { adminProtect } = require('../middlewares/adminAuth');

// ==========================================
// ADMIN YO'LLARI (ROUTES)
// ==========================================

// Login (Ochiq yo'l, himoyalanmagan)
router.post('/login', adminLogin);

// Dashboard - Barcha foydalanuvchilar va umumiy ma'lumotlar
router.get('/dashboard', adminProtect, getDashboardData);

// Foydalanuvchi tafsilotlari va uning kitoblari
router.get('/users/:id', adminProtect, getUserFullDetails);

// Admin uchun kengaytirilgan qidiruv (E'lonlar bo'yicha)
router.get('/search', adminProtect, adminAdvancedSearch);

// Kitobni (e'lonni) tahrirlash uchun ma'lumotlarni olish
router.get('/books/:id', adminProtect, getAdminBook);

// Kitob ma'lumotlarini yangilash
router.put('/books/:id', adminProtect, updateAdminBook);

// Global o'chirish (Foydalanuvchi, Kitob yoki Izoh)
// Sening kontrollerdagi 'deleteEverything' funksiyasiga moslangan
router.delete('/delete/:type/:id', adminProtect, deleteEverything);

module.exports = router;