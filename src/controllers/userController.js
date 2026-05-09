const User = require('../models/User');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const bcrypt = require('bcryptjs');

// @desc    Barcha foydalanuvchilarni olish (Admin uchun)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Ruxsat etilmagan!" });
        }
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: users });
    } catch (error) { next(error); }
};

// @desc    Boshqa foydalanuvchi profilini ko'rish
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi!" });
        res.status(200).json({ success: true, data: user });
    } catch (error) { next(error); }
};

// @desc    Profil, login va parolni tahrirlash (Xavfsizlik bilan)
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });

        const { 
            firstName, lastName, region, district, 
            oldPhoneNumber, newPhoneNumber, 
            oldPassword, newPassword 
        } = req.body;

        if (newPhoneNumber || newPassword) {
            if (!oldPassword) {
                return res.status(400).json({ success: false, message: "Login yoki parolni o'zgartirish uchun joriy parolingizni kiriting!" });
            }
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Eski parolingiz noto'g'ri!" });
            }
        }

        if (newPhoneNumber && newPhoneNumber !== user.phoneNumber) {
            const exists = await User.findOne({ phoneNumber: newPhoneNumber });
            if (exists) return res.status(400).json({ success: false, message: "Bu yangi raqam band!" });
            user.phoneNumber = newPhoneNumber;
        }

        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.region = region || user.region;
        user.district = district || user.district;

        await user.save();
        
        const updatedUser = await User.findById(user._id).select('-password');
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) { next(error); }
};

// @desc    Obuna bo'lish / bekor qilish
// @route   POST /api/users/:id/follow
// @access  Private
exports.toggleFollow = async (req, res, next) => {
    try {
        const sellerId = req.params.id;
        const userId = req.user.id;
        
        if(sellerId === userId) {
            return res.status(400).json({ success: false, message: "O'zingizga obuna bo'la olmaysiz!" });
        }

        const existingFollow = await Follow.findOne({ follower: userId, following: sellerId });
        
        if (existingFollow) {
            await Follow.findByIdAndDelete(existingFollow._id);
            await User.findByIdAndUpdate(sellerId, { $inc: { followersCount: -1 } });
            return res.status(200).json({ success: true, message: "Obuna bekor qilindi", isFollowing: false });
        } else {
            await Follow.create({ follower: userId, following: sellerId });
            await User.findByIdAndUpdate(sellerId, { $inc: { followersCount: 1 } });
            return res.status(200).json({ success: true, message: "Sodiq mijozga aylandingiz", isFollowing: true });
        }
    } catch (error) { next(error); }
};

// @desc    Obunachilar yoki obunalarni olish (Network)
// @route   GET /api/users/me/network
// @access  Private
exports.getNetwork = async (req, res, next) => {
    try {
        const { type } = req.query; // 'followers' yoki 'following'
        let query = type === 'followers' ? { following: req.user.id } : { follower: req.user.id };
        const populateField = type === 'followers' ? 'follower' : 'following';
        
        const network = await Follow.find(query)
            .populate(populateField, 'firstName lastName region district phoneNumber avatar');
        
        const data = network.map(n => n[populateField]).filter(u => u !== null);
        
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

// @desc    Obuna holatini tekshirish
// @route   GET /api/users/:id/check-follow
// @access  Private
exports.checkFollow = async (req, res, next) => {
    try {
        const isFollowing = await Follow.exists({ follower: req.user.id, following: req.params.id });
        res.status(200).json({ success: true, isFollowing: !!isFollowing });
    } catch (error) { next(error); }
};

// @desc    Mening layk bosgan kitoblarim ID larini olish
// @route   GET /api/users/me/likes
// @access  Private
exports.getMyLikes = async (req, res, next) => {
    try {
        const likes = await Like.find({ user: req.user.id });
        res.status(200).json({ success: true, data: likes.map(l => l.book) });
    } catch (error) { next(error); }
};

// ==========================================
// YANGLIK: OBUNACHINI CHIQARIB TASHLASH MANTIG'I
// ==========================================
// @desc    Obunachini chiqarib tashlash
// @route   PUT /api/users/remove-follower/:id
// @access  Private
exports.removeFollower = async (req, res, next) => {
    try {
        const followerId = req.params.id; // Chiqarib tashlanayotgan foydalanuvchi ID
        const myId = req.user.id;         // Mening ID im (Men obuna bo'lingan shaxsman)

        const existingFollow = await Follow.findOne({ follower: followerId, following: myId });
        if (!existingFollow) {
            return res.status(404).json({ success: false, message: "Bu foydalanuvchi sizga obuna bo'lmagan" });
        }

        await Follow.findByIdAndDelete(existingFollow._id);
        await User.findByIdAndUpdate(myId, { $inc: { followersCount: -1 } }); // Mening obunachilarim soni 1 taga kamayadi
        
        res.status(200).json({ success: true, message: "Obunachi chiqarib tashlandi!" });
    } catch (error) { next(error); }
};