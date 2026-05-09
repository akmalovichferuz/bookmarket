const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Foydalanuvchini ro'yxatdan o'tkazish
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, region, district, phoneNumber, password, confirmPassword } = req.body;

        // Barcha maydonlar to'ldirilganligini tekshirish
        if (!firstName || !lastName || !region || !district || !phoneNumber || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: "Barcha maydonlarni to'ldiring!" });
        }

        // Telefon raqami formati tekshiruvi (Faqat raqamlar va ixtiyoriy boshidagi '+')
        const phoneRegex = /^\+?[0-9]{9,15}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: "Telefon raqami noto'g'ri formatda! Faqat raqamlarni kiriting (masalan: +998901234567)." 
            });
        }

        // Parol va tasdiqlovchi parol mosligini tekshirish
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Parollar bir-biriga mos kelmadi!" });
        }

        // Telefon raqami bazada bor-yo'qligini tekshirish
        let existingUser = await User.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Bu telefon raqami orqali avval ro'yxatdan o'tilgan!" });
        }

        // Parolni hashlash (shifrlash)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Yangi foydalanuvchini yaratish
        const user = await User.create({
            firstName,
            lastName,
            region,
            district,
            phoneNumber,
            password: hashedPassword
        });

        // JWT token yaratish
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d' // Token 30 kun yaroqli
        });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                region: user.region,
                district: user.district
            }
        });

    } catch (error) {
        next(error); // Xatolikni errorMiddleware ga yuboramiz
    }
};

// @desc    Tizimga kirish (Login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { phoneNumber, password } = req.body;

        // Maydonlarni tekshirish
        if (!phoneNumber || !password) {
            return res.status(400).json({ success: false, message: "Telefon raqam va parolni kiriting!" });
        }

        // Foydalanuvchini topish (DIQQAT: .select('+password') qo'shildi, bu juda muhim!)
        const user = await User.findOne({ phoneNumber }).select('+password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: "Telefon raqam yoki parol noto'g'ri!" });
        }

        // Xatolikni (Illegal arguments) oldini oluvchi himoya: 
        // Agar eski chala ro'yxatdan o'tgan user bo'lsa va paroli bazada bo'lmasa, server qulamasligi uchun
        if (!user.password) {
            return res.status(400).json({ 
                success: false, 
                message: "Ushbu profilning paroli bazada yo'q! Iltimos, boshqatdan ro'yxatdan o'ting." 
            });
        }

        // Parolni tekshirish
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Telefon raqam yoki parol noto'g'ri!" });
        }

        // JWT token yaratish
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                region: user.region,
                district: user.district
            }
        });

    } catch (error) {
        // Xato bo'lsa serverni o'chirib yubormasligi uchun JSON qaytaramiz
        res.status(500).json({ success: false, message: error.message || "Serverda xatolik yuz berdi" });
    }
};

// @desc    Joriy foydalanuvchi ma'lumotlarini olish (Profil)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        // req.user bizning authMiddleware orqali keladi
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};