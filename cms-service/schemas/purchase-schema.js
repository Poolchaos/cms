var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var PurchaseSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: [true, 'No order id specified.']
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: [true, 'No user id specified.']
  },
  articleId: {
    type: Schema.Types.ObjectId,
    required: [true, 'No article id specified.']
  },
  date: Date
}, { collection : 'purchases' });

module.exports = PurchaseSchema;