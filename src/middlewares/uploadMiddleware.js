const multer = require('multer');
const path = require('path');

// Rasmlar qayerga va qanday nom bilan saqlanishini sozlash
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/'));
    },
    filename: function (req, file, cb) {
        // Rasm nomi takrorlanmasligi uchun unga hozirgi vaqtni qo'shamiz
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Faqat rasm formatidagi fayllarni o'tkazish
const checkFileType = (file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Faqat rasm formatidagi (jpeg, jpg, png, webp) fayllar yuklanishi mumkin!'));
    }
};

// Yuklash obyekti
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // Maksimal hajm: 5MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;