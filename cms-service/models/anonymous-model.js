const mongoose = require('mongoose');
const AnonymousSchema = require('../schemas/anonymous-schema');

// Compile model from schema
var AnonymousModel = mongoose.model('AnonymousModel', AnonymousSchema);

module.exports = AnonymousModel;