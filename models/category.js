let mongoose = require('mongoose');

let categorySchema = require('../schemas/categories');

module.exports = mongoose.model('Category',categorySchema);