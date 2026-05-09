const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB bazasiga ulandi: ${conn.connection.host}`);
    } catch (err) {
        console.error(`MongoDB ulanishida xatolik: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;