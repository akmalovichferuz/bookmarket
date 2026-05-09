const Book = require('../models/Book');

class SearchService {
    // 1. Barcha mavjud janrlarni bazadan tortib olish (Select uchun)
    static async getAvailableGenres() {
        // distinct bazadagi takrorlanmas janrlarni ro'yxat qilib beradi
        const genres = await Book.distinct('genre');
        return genres;
    }

    // 2. Tanlangan janrga qarab yozuvchilarni avto-tavsiya qilish
    static async getAuthorsSuggestion(genre, searchString) {
        let query = {};
        
        // Agar janr tanlangan bo'lsa, faqat shu janrdagi kitoblarni izlaymiz
        if (genre) {
            query.genre = genre;
        }

        // Agar foydalanuvchi qidiruv maydoniga harf yozgan bo'lsa (masalan "pi")
        if (searchString) {
            // "pi" bilan boshlanadigan yoki ichida "pi" bor mualliflarni izlash (katta-kichik harf farqsiz - 'i')
            query.author = { $regex: searchString, $options: 'i' };
        }

        // Faqat muallif ismlarini olish va takroriylarini olib tashlash
        const authors = await Book.find(query).distinct('author');
        return authors;
    }

    // 3. Tanlangan janr va muallifga qarab kitob nomlarini avto-tavsiya qilish
    static async getTitlesSuggestion(genre, author, searchString) {
        let query = {};

        if (genre) query.genre = genre;
        if (author) query.author = author;

        // Agar foydalanuvchi qidiruv maydoniga harf yozgan bo'lsa (masalan "mu")
        if (searchString) {
            query.title = { $regex: searchString, $options: 'i' };
        }

        const titles = await Book.find(query).distinct('title');
        return titles;
    }
}

module.exports = SearchService;