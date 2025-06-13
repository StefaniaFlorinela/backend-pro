const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.URI_MONGOBD;

mongoose.connect(URI)
    .then(() => {
        console.log('Connected at MongoDB successfully!')
    })
    .catch((error) => {
        console.error('Database connection error', error)
    });

    
module.exports = app;