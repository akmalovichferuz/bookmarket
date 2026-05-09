const Book = require('../models/Book');
const User = require('../models/User');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const SearchService = require('../services/searchService');

exports.createBook = async (req, res, next) => {
    try {
        const { title, author, genre, price, pages, paperType, width, height } = req.body;
        if (!title || !author || !genre || !price || !pages || !paperType || !width || !height) {
            return res.status(400).json({ success: false, message: "Barcha ma'lumotlarni to'ldiring!" });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "Kamida bitta rasm yuklashingiz shart!" });
        }
        const imagePaths = req.files.map(file => file.filename);
        const book = await Book.create({ title, author, genre, price, pages, paperType, dimensions: { width, height }, images: imagePaths, seller: req.user.id });
        await User.findByIdAndUpdate(req.user.id, { $inc: { totalBooks: 1 } });
        res.status(201).json({ success: true, data: book });
    } catch (error) { next(error); }
};

// YANGLANGAN VA XATOSIZ QIDIRUV (Regex va Soft Delete orqali)
exports.getBooks = async (req, res, next) => {
    try {
        const { q, genre, author, title } = req.query;
        let query = {};

        // MUHIM: Faqatgina hali sotilmagan (isSold: true bo'lmagan) kitoblarni ko'rsatamiz!
        // $ne: true degani "true ga teng bo'lmagan barchasi" (ya'ni false yoki null)
        query.isSold = { $ne: true };

        // Qidiruv maydoni (Index talab qilmaydigan universal usul)
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { author: { $regex: q, $options: 'i' } }
            ];
        }

        if (genre) query.genre = genre;
        if (author) query.author = { $regex: author, $options: 'i' };
        if (title) query.title = { $regex: title, $options: 'i' };

        const books = await Book.find(query)
            .populate('seller', 'firstName lastName phoneNumber region district avatar totalBooks followersCount totalLikesReceived totalCommentsReceived')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: books.length, data: books });
    } catch (error) { next(error); }
};

exports.getSuggestions = async (req, res, next) => {
    try {
        const { type, genre, author, search } = req.query;
        let data = [];
        if (type === 'genre') data = await SearchService.getAvailableGenres();
        else if (type === 'author') data = await SearchService.getAuthorsSuggestion(genre, search);
        else if (type === 'title') data = await SearchService.getTitlesSuggestion(genre, author, search);
        res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
};

exports.toggleLikeBook = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        const userId = req.user.id;
        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ success: false, message: "Kitob topilmadi!" });

        const existingLike = await Like.findOne({ user: userId, book: bookId });
        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id);
            await Book.findByIdAndUpdate(bookId, { $inc: { likesCount: -1 } });
            await User.findByIdAndUpdate(book.seller, { $inc: { totalLikesReceived: -1 } });
            return res.status(200).json({ success: true, message: "Layk olib tashlandi" });
        } else {
            await Like.create({ user: userId, book: bookId });
            await Book.findByIdAndUpdate(bookId, { $inc: { likesCount: 1 } });
            await User.findByIdAndUpdate(book.seller, { $inc: { totalLikesReceived: 1 } });
            return res.status(200).json({ success: true, message: "Layk bosildi" });
        }
    } catch (error) { next(error); }
};

exports.addComment = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: "Izoh matnini kiriting!" });
        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ success: false, message: "Kitob topilmadi!" });

        const comment = await Comment.create({ user: req.user.id, book: bookId, text: text });
        await Book.findByIdAndUpdate(bookId, { $inc: { commentsCount: 1 } });
        await User.findByIdAndUpdate(book.seller, { $inc: { totalCommentsReceived: 1 } });
        res.status(201).json({ success: true, data: comment });
    } catch (error) { next(error); }
};

exports.getSellerBooks = async (req, res, next) => {
    try {
        const books = await Book.find({ seller: req.params.sellerId })
            .populate('seller', 'firstName lastName phoneNumber region district avatar totalBooks totalLikesReceived totalCommentsReceived')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: books.length, data: books });
    } catch (error) { next(error); }
};

exports.getBookComments = async (req, res, next) => {
    try {
        const comments = await Comment.find({ book: req.params.id }).populate('user', 'firstName lastName avatar').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: comments.length, data: comments });
    } catch (error) { next(error); }
};

exports.getBookById = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id).populate('seller', 'firstName lastName phoneNumber region district avatar totalBooks totalLikesReceived followersCount');
        if (!book) return res.status(404).json({ success: false, message: "Kitob topilmadi!" });
        res.status(200).json({ success: true, data: book });
    } catch (error) { next(error); }
};

exports.deleteBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ success: false, message: "Kitob topilmadi!" });
        if (book.seller.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Ruxsat yo'q!" });
        
        await book.deleteOne();
        await User.findByIdAndUpdate(req.user.id, { $inc: { totalBooks: -1 } });
        res.status(200).json({ success: true, message: "E'lon o'chirildi!" });
    } catch (error) { next(error); }
};

// KITOBNI TAHRIRLASH
exports.updateBook = async (req, res, next) => {
    try {
        let book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ success: false, message: "Kitob topilmadi!" });
        if (book.seller.toString() !== req.user.id) return res.status(403).json({ success: false, message: "Ruxsat yo'q!" });

        const { title, author, genre, price, pages, paperType, width, height } = req.body;
        
        let updateData = { title, author, genre, price, pages, paperType, dimensions: { width, height } };

        // Agar yangi rasm yuklangan bo'lsa
        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => file.filename);
        }

        book = await Book.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: book });
    } catch (error) { next(error); }
};