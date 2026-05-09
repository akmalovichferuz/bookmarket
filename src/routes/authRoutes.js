const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Foydalanuvchilarni autentifikatsiya qilish va ro'yxatdan o'tkazish API lari
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Yangi foydalanuvchini ro'yxatdan o'tkazish
 *     description: Tizimga yangi foydalanuvchi qo'shish va avtomatik token olish.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - phoneNumber
 *               - password
 *               - region
 *               - district
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Feruz"
 *               lastName:
 *                 type: string
 *                 example: "Toxirov"
 *               phoneNumber:
 *                 type: string
 *                 example: "+998901234567"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "parol123"
 *               region:
 *                 type: string
 *                 example: "Buxoro"
 *               district:
 *                 type: string
 *                 example: "Vobkent"
 *     responses:
 *       201:
 *         description: Muvaffaqiyatli ro'yxatdan o'tdi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Kiritilgan ma'lumotlar xato yoki bunday raqam band.
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Tizimga kirish
 *     description: Telefon raqam va parol orqali tizimga kirish hamda JWT token olish.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - password
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+998901234567"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "parol123"
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli tizimga kirildi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Telefon raqam yoki parol noto'g'ri.
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Shaxsiy profilni ko'rish
 *     description: Tizimga kirgan foydalanuvchi o'z ma'lumotlarini olishi (Token talab qilinadi).
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Foydalanuvchi ma'lumotlari muvaffaqiyatli olindi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *       401:
 *         description: Avtorizatsiyadan o'tilmagan (Token yo'q yoki xato).
 */
router.get('/me', protect, getMe);

module.exports = router;