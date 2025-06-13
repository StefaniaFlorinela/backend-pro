const mongoose = require('mongoose');
const { sluggerPlugin } = require('mongoose-slugger-plugin');
let Column = require('./Column')

const dashboardSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    slug: String,

    icon: String,
    backgroundImage: String,

    columns: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Column'
    }],
}, {
    timestamps: true,
    versionKey: false
});

dashboardSchema.index({ owner: 1, slug: 1 }, { name: 'owner_slug', unique: true });

dashboardSchema.plugin(sluggerPlugin, {
    slugPath: 'slug',
    generateFrom: ['name'],
    maxLength: 15,
    index: 'owner_slug',
});

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

module.exports = Dashboard;