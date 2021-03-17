const mongoose = require('mongoose');
const RegistrationSchema = require('../schemas/registration-schema');

// Compile model from schema
var RegistrationModel = mongoose.model('RegistrationModel', RegistrationSchema);

module.exports = RegistrationModel;