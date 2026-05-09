const jwt = require('jsonwebtoken');

const adminProtect = async (req, res, next) => {
    let token;

    // 1. Headerni tekshiramiz
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // 2. TEKSHIRISH: ADMIN_JWT_SECRET ishlatilishi shart!
            const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

            // 3. Admin ekanligini tasdiqlaymiz
            if (decoded.role === 'admin') {
                req.admin = decoded; // Admin ma'lumotlarini so'rovga biriktiramiz
                return next();
            } else {
                return res.status(403).json({ success: false, message: "Kirish taqiqlangan: Siz admin emassiz!" });
            }

        } catch (error) {
            console.error("Admin Token xatosi:", error);
            return res.status(401).json({ 
                success: false, 
                message: "Xato: Token xato yoki muddati o'tgan!" 
            });
        }
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Avtorizatsiyadan o'tilmadi, token yo'q!" 
        });
    }
};

module.exports = { adminProtect };