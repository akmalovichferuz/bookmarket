const express = require('express');
const router = express.Router();

const { createBook, getBooks, getSuggestions, toggleLikeBook, addComment, getBookComments, getSellerBooks, getBookById, deleteBook, updateBook } = require('../controllers/bookController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/suggestions', getSuggestions);
router.get('/', getBooks);
router.get('/seller/:sellerId', getSellerBooks);
router.get('/:id', getBookById);

router.post('/', protect, upload.array('images', 5), createBook);
router.post('/:id/like', protect, toggleLikeBook);
router.post('/:id/comment', protect, addComment);
router.get('/:id/comments', getBookComments);
router.delete('/:id', protect, deleteBook);
// YANGLIK: Tahrirlash marshruti
router.put('/:id', protect, upload.array('images', 5), updateBook); 

module.exports = router;