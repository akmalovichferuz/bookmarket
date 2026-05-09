const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');
const Chat = require('../models/Chat');

// ==========================================
// 1. SAVATCHA (CART) MANTIQLARI
// ==========================================

exports.addToCart = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const bookId = req.params.bookId;

        // Agar savatda yo'q bo'lsa qo'shamiz
        if (!user.cart.includes(bookId)) {
            user.cart.push(bookId);
            await user.save();
        }
        res.status(200).json({ success: true, message: "Savatchaga qo'shildi!" });
    } catch (error) { next(error); }
};

exports.removeFromCart = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.cart = user.cart.filter(id => id.toString() !== req.params.bookId);
        await user.save();
        res.status(200).json({ success: true, message: "Savatchadan olib tashlandi!" });
    } catch (error) { next(error); }
};

exports.getCart = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('cart');
        res.status(200).json({ success: true, data: user.cart });
    } catch (error) { next(error); }
};

// ==========================================
// 2. BUYURTMA (ORDER) MANTIQLARI
// ==========================================

exports.checkout = async (req, res, next) => {
    try {
        // Front-end'dan belgilangan kitoblar ID lari (array) keladi
        const { bookIds } = req.body; 
        if (!bookIds || bookIds.length === 0) {
            return res.status(400).json({ success: false, message: "Rasmiylashtirish uchun kitob tanlanmagan!" });
        }

        const books = await Book.find({ _id: { $in: bookIds } });
        
        // Har bir kitob uchun alohida Zakaz (Order) yaratamiz
        const orders = [];
        for (let book of books) {
            const newOrder = await Order.create({
                book: book._id,
                buyer: req.user.id,
                seller: book.seller // E'lon egasi (Admin)
            });
            orders.push(newOrder);
        }

        // Zakaz qilinganlarni savatchadan tozalab tashlaymiz
        const user = await User.findById(req.user.id);
        user.cart = user.cart.filter(id => !bookIds.includes(id.toString()));
        await user.save();

        res.status(201).json({ success: true, message: "Buyurtma rasmiylashtirildi! Sotuvchi tasdiqlashi kutilmoqda.", data: orders });
    } catch (error) { next(error); }
};

exports.getMyPurchases = async (req, res, next) => {
    try {
        // Xaridor sifatidagi zakazlarim
        const orders = await Order.find({ buyer: req.user.id }).populate('book').populate('seller', 'firstName lastName phoneNumber').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) { next(error); }
};

exports.getMySales = async (req, res, next) => {
    try {
        // E'lon egasi (Sotuvchi) sifatidagi kelib tushgan zakazlar
        const orders = await Order.find({ seller: req.user.id }).populate('book').populate('buyer', 'firstName lastName phoneNumber').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) { next(error); }
};
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status, reason } = req.body; 
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ success: false, message: "Buyurtma topilmadi" });
        
        if (order.seller.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Sizda bunday huquq yo'q!" });
        }

        if (status === 'tasdiqlandi') {
            order.status = 'tasdiqlandi';
            await order.save();

            // Qolgan zakazlarni avtomat rad etish
            await Order.updateMany(
                { 
                    book: order.book,       
                    _id: { $ne: order._id }, 
                    status: 'kutilmoqda'    
                },
                { 
                    $set: { 
                        status: 'rad_etildi', 
                        rejectReason: 'Boshqa xaridorga sotildi' 
                    } 
                }
            );

            // =========================================================
            // MANTIQIY O'CHIRISH (SOFT DELETE) - MUAMMO YECHIMI SHU YERDA
            // =========================================================
            // Kitobni bazadan o'chirmaymiz! Shunchaki isSold = true qilib qo'yamiz.
            // Shunda zakazlar va chatlar o'zining rasmi va nomini yo'qotmaydi!
            await Book.findByIdAndUpdate(order.book, { isSold: true });

        } 
        else {
            order.status = status;
            if (reason) order.rejectReason = reason; 
            await order.save();
        }

        res.status(200).json({ success: true, message: `Buyurtma statusi: ${status.replace('_', ' ')}!`, data: order });
    } catch (error) { next(error); }
};
// ==========================================
// 3. CHAT MANTIQLARI
// ==========================================

exports.sendMessage = async (req, res, next) => {
    try {
        const { bookId, text, receiverId } = req.body;

        // Xaridor va Sotuvchi o'rtasida shu kitob bo'yicha chat bormi tekshiramiz
        let chat = await Chat.findOne({
            book: bookId,
            $or: [
                { buyer: req.user.id, seller: receiverId },
                { buyer: receiverId, seller: req.user.id }
            ]
        });

        // Agar chat bo'lmasa, yangi yaratamiz
        if (!chat) {
            chat = await Chat.create({
                book: bookId,
                buyer: req.user.id === receiverId ? receiverId : req.user.id, 
                seller: receiverId // Odatda e'lon egasi
            });
        }

        // Xabarni qo'shamiz
        chat.messages.push({
            sender: req.user.id,
            text: text
        });

        await chat.save();
        res.status(201).json({ success: true, data: chat });
    } catch (error) { next(error); }
};

exports.getMyChats = async (req, res, next) => {
    try {
        // Men yo xaridor, yoki sotuvchi bo'lgan barcha chatlar
        const chats = await Chat.find({
            $or: [{ buyer: req.user.id }, { seller: req.user.id }]
        }).populate('book', 'title images price').populate('buyer seller', 'firstName lastName avatar').sort({ updatedAt: -1 });
        
        res.status(200).json({ success: true, data: chats });
    } catch (error) { next(error); }
};