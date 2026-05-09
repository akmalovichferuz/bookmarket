const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    }
}, {
    timestamps: true
});

// Bir foydalanuvchi bitta kitobga faqat bir marta layk bosa olishi uchun
likeSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);