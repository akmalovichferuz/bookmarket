const express = require('express');
const router = express.Router();
const { 
    getUserProfile, 
    updateUserProfile, 
    toggleFollow, 
    getNetwork, 
    getMyLikes, 
    getAllUsers,
    removeFollower // YANGLIK: Obunachini o'chirish funksiyasi chaqirildi
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/me/network', protect, getNetwork); // OBUNALAR YO'LI
router.get('/me/likes', protect, getMyLikes);
router.put('/profile', protect, updateUserProfile);
router.post('/:id/follow', protect, toggleFollow);

// YANGLIK: Obunachini chiqarib tashlash marshruti
router.put('/remove-follower/:id', protect, removeFollower);

router.get('/', protect, getAllUsers);
router.get('/:id', getUserProfile);


module.exports = router;