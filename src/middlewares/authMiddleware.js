const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Tokenni "Bearer " so'zidan ajratib olish
            token = req.headers.authorization.split(' ')[1];

            // Tokenni maxfiy kalit orqali tekshirish (Dekodlash)
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Paroldan tashqari barcha foydalanuvchi ma'lumotlarini so'rovga qo'shib yuborish
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error("Token xatosi:", error);
            res.status(401).json({ 
                success: false, 
                message: "Avtorizatsiyadan o'tilmadi, token yaroqsiz yoki muddati tugagan" 
            });
        }
    }

    if (!token) {
        res.status(401).json({ 
            success: false, 
            message: "Avtorizatsiyadan o'tilmadi, token taqdim etilmadi" 
        });
    }
};

module.exports = { protect };