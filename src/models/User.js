const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    region: { type: String, required: true },
    district: { type: String, required: true },
    avatar: { type: String, default: 'default_avatar.png' },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    totalBooks: { type: Number, default: 0 },
    totalLikesReceived: { type: Number, default: 0 },
    totalCommentsReceived: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    
    // YANGLIK: Savatcha (Cart) tizimi uchun mahsulotlar ro'yxati
    cart: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Book' 
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);