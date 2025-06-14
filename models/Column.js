const mongoose = require('mongoose');
let Card = require('./Card');

const columnSchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'To Do',
        required: true
    },
    cards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card'
    }],
},
    {
        versionKey: false
    });

const Column = mongoose.model('Column', columnSchema);

module.exports = Column;