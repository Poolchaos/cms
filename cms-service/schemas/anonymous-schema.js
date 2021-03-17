var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var AnonymousSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: [true, 'No identifier specified']
  },
  anonymous: String
}, { collection : '_tokenIndex' });

module.exports = AnonymousSchema;