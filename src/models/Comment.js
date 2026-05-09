const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    text: {
        type: String,
        required: [true, 'Izoh matni kiritilishi shart'],
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);