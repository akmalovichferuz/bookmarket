const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    book: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Book', 
        required: true 
    },
    buyer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true // Sotib oluvchi
    },
    seller: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true // E'lon egasi (Sotuvchi)
    },
    status: { 
        type: String, 
        enum: ['kutilmoqda', 'tasdiqlandi', 'rad_etildi', 'yetkazib_berildi'], 
        default: 'kutilmoqda' 
    },
    rejectReason: { // YAngi qo'shilgan maydon
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);