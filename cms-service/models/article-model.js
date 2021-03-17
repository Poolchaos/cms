const mongoose = require('mongoose');

const ArticleSchema = require('../schemas/article-schema');

var ArticleModel = mongoose.model('ArticleModel', ArticleSchema);

module.exports = ArticleModel;