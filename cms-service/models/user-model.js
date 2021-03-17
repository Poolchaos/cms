const mongoose = require('mongoose');

const UserSchema = require('../schemas/user-schema');

var UserModel = mongoose.model('UserModel', UserSchema );

module.exports = UserModel;