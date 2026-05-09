const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
    addToCart, removeFromCart, getCart, 
    checkout, getMyPurchases, getMySales, updateOrderStatus,
    sendMessage, getMyChats 
} = require('../controllers/marketController');

// 1. Savatcha marshrutlari
router.post('/cart/:bookId', protect, addToCart);
router.delete('/cart/:bookId', protect, removeFromCart);
router.get('/cart', protect, getCart);

// 2. Buyurtma marshrutlari
router.post('/checkout', protect, checkout);
router.get('/orders/purchases', protect, getMyPurchases); // Mening xaridlarim
router.get('/orders/sales', protect, getMySales); // Mening sotuvlarim
router.put('/orders/:id/status', protect, updateOrderStatus); // Tasdiqlash / Rad etish

// 3. Chat marshrutlari
router.post('/chat', protect, sendMessage);
router.get('/chat', protect, getMyChats);

module.exports = router;