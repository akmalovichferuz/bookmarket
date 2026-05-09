const User = require('../models/User');
const Book = require('../models/Book');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const jwt = require('jsonwebtoken');

// =========================================================
// 1. ADMIN LOGIN
// =========================================================
exports.adminLogin = (req, res) => {
    const { login, password } = req.body;
    
    if (login === process.env.ADMIN_LOGIN && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ login, role: 'admin' }, process.env.ADMIN_JWT_SECRET, { expiresIn: '24h' });
        return res.status(200).json({ success: true, token });
    }
    
    res.status(401).json({ success: false, message: "Login yoki parol noto'g'ri!" });
};

// =========================================================
// 2. DASHBOARD (FOYDALANUVCHILAR VA KITOBOTLARNI BIRGA BERADI)
// =========================================================
exports.getDashboardData = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        // Yangilik: Sahifa ochilganda kitoblar ham ko'rinishi uchun ularni ham qo'shdik
        const books = await Book.find().populate('seller', 'firstName lastName').sort({ createdAt: -1 }).limit(20);
        
        res.status(200).json({ 
            success: true, 
            users, 
            books // Endi frontend buni ko'radi!
        });
    } catch (e) { 
        res.status(500).json({ success: false, message: "Server xatosi yuz berdi" }); 
    }
};

// =========================================================
// 3. FOYDALANUVCHINI TO'LIQ KO'RISH (MODAL UCHUN)
// =========================================================
exports.getUserFullDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
        }

        const books = await Book.find({ seller: req.params.id }).sort({ createdAt: -1 });
        const following = await Follow.countDocuments({ follower: req.params.id });
        const followers = await Follow.countDocuments({ following: req.params.id });
        
        res.status(200).json({ 
            success: true, 
            data: { ...user._doc, books, stats: { following, followers } } 
        });
    } catch (e) { 
        res.status(500).json({ success: false, message: "Ma'lumotlarni yuklashda xato" }); 
    }
};

// =========================================================
// 4. KENGAYTIRILGAN QIDIRUV (E'LONLAR VA MUALLIF)
// =========================================================
exports.adminAdvancedSearch = async (req, res) => {
    try {
        const { q, genre } = req.query;
        let query = {};
        
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { author: { $regex: q, $options: 'i' } }
            ];
        }
        if (genre) {
            query.genre = genre;
        }

        const books = await Book.find(query).populate('seller', 'firstName lastName phoneNumber').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: books });
    } catch (e) { 
        res.status(500).json({ success: false, message: "Qidiruvda xatolik yuz berdi" }); 
    }
};

// =========================================================
// 5. KITOBNI TAHRIRLASH UCHUN OLIB KELISH (MODAL UCHUN)
// =========================================================
exports.getAdminBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('seller', 'firstName lastName');
        if (!book) {
            return res.status(404).json({ success: false, message: "Kitob topilmadi!" });
        }
        res.status(200).json({ success: true, data: book });
    } catch (e) { 
        res.status(500).json({ success: false, message: "Kitobni yuklashda xatolik" }); 
    }
};

// =========================================================
// 6. KITOBNI TAHRIRLASH VA SAQLASH
// =========================================================
exports.updateAdminBook = async (req, res) => {
    try {
        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        
        if (!updatedBook) {
            return res.status(404).json({ success: false, message: "Kitob topilmadi yoki o'chib ketgan!" });
        }
        
        res.status(200).json({ success: true, data: updatedBook, message: "E'lon muvaffaqiyatli yangilandi!" });
    } catch (e) { 
        res.status(500).json({ success: false, message: "Saqlashda xatolik yuz berdi" }); 
    }
};

// =========================================================
// 7. GLOBAL O'CHIRISH (FOYDALANUVCHI, KITOB)
// =========================================================
exports.deleteEverything = async (req, res) => {
    try {
        const { type, id } = req.params;
        
        if (type === 'user') {
            // Foydalanuvchini va unga tegishli hamma narsani tozalash (Kaskadli o'chirish)
            await User.findByIdAndDelete(id);
            await Book.deleteMany({ seller: id });
            await Comment.deleteMany({ user: id });
            await Follow.deleteMany({ $or: [{ follower: id }, { following: id }] });
            
        } else if (type === 'book') {
            // Kitobni va uning izohlarini tozalash
            await Book.findByIdAndDelete(id);
            await Comment.deleteMany({ book: id });
            
        } else if (type === 'comment') {
            // Faqat izohni o'chirish
            await Comment.findByIdAndDelete(id);
        }
        
        res.status(200).json({ success: true, message: "Muvaffaqiyatli o'chirildi!" });
    } catch (e) { 
        res.status(500).json({ success: false, message: "O'chirish operatsiyasida xatolik yuz berdi" }); 
    }
};