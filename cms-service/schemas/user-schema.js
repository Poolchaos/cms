var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: [true, 'No identifier specified.']
  },
  firstName: {
    type: String,
    required: [true, 'No firstname specified.']
  },
  surname: {
    type: String,
    required: [true, 'No surname specified.']
  },
  email: {
    type: String,
    required: [true, 'No email specified']
  },
  password: {
    type: String,
    required: [true, 'No password specified.']
  },
  token: {
    type: String,
    required: [true, 'No token specified.']
  },
  number: {
    type: String,
    required: [true, 'No number specified.']
  },
  role: {
    type: String,
    required: [true, 'No role specified.']
  },
  permissions: {
    type: Boolean,
    required: [true, 'No permissions.']
  }
}, { collection : 'users' });

module.exports = UserSchema;