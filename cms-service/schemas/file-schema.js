var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var RegistrationSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: [true, 'No identifier specified']
  },
  name: String,
  location: String,
  type: String,
  articleId: String
}, { collection : 'audio' });

module.exports = RegistrationSchema;