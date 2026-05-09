const errorMiddleware = (err, req, res, next) => {
    console.error(`Xatolik yuz berdi: ${err.message}`);
    
    // Agar status kod 200 bo'lib qolgan bo'lsa, uni 500 (Server xatosi) ga o'zgartiramiz
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        success: false,
        message: err.message,
        // Dastur qaysi qatorda xato qilganini faqat development muhitida ko'rsatamiz
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorMiddleware;