const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BookMarket API Dokumentatsiyasi',
            version: '1.0.0',
            description: 'BookMarket platformasi uchun yaratilgan barcha API yo\'nalishlari',
            contact: {
                name: 'Feruz Akmalovich',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Lokal server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.js'], // Router fayllaridagi kommentlarni o'qiydi
};

const specs = swaggerJsdoc(options);
module.exports = specs;