const mongoose = require('mongoose');
const FileSchema = require('../schemas/file-schema');

// Compile model from schema
var FileModel = mongoose.model('FileModel', FileSchema);

module.exports = FileModel;