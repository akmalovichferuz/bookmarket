const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Kitob nomi kiritilishi shart'],
        trim: true,
        index: true 
    },
    isSold: {
        type: Boolean,
        default: false 
    },
    author: {
        type: String,
        required: [true, 'Kitob muallifi kiritilishi shart'],
        trim: true,
        index: true
    },
    genre: {
        type: String,
        required: [true, 'Kitob janri kiritilishi shart'],
        index: true
    },
    price: { type: Number, required: true },
    pages: {
        type: Number,
        required: [true, 'Sahifalar soni kiritilishi shart']
    },
    paperType: {
        type: String,
        required: [true, 'Qog\'oz turi kiritilishi shart'],
        enum: [
            'Ofset qog\'oz (Oq qog\'oz)',
            'Gazeta qog\'ozi (Sarg\'ish)',
            'Melyovanniy qog\'oz (Yaltiroq/Silliq)',
            'Kraft qog\'oz',
            'Kitob-dizayner qog\'ozi (Sariq/Fil suyagi rangi)'
        ]
    },
    dimensions: {
        width: {
            type: Number,
            required: [true, 'Kitobning eni kiritilishi shart (sm da)']
        },
        height: {
            type: Number,
            required: [true, 'Kitobning bo\'yi kiritilishi shart (sm da)']
        }
    },
    images: [{
        type: String,
        required: [true, 'Kamida bitta rasm yuklanishi shart']
    }],
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likesCount: {
        type: Number,
        default: 0
    },
    commentsCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Umumiy qidiruv uchun matnli indeks
bookSchema.index({ title: 'text', author: 'text' });

module.exports = mongoose.model('Book', bookSchema);