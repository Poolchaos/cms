var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var updateSchema = new Schema({
  userId: Schema.Types.ObjectId,
  timestamp: Date
})

var ArticleSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: [true, 'No identifier specified.']
  },
  name: {
    type: String,
    required: [true, 'Please specify an article name.']
  },
  category: {
    type: String,
    required: [true, 'Please specify a category.']
  },
  content: {
    type: String,
    required: [true, 'Please specify article content.']
  },
  created: updateSchema,
  updated: [updateSchema],
  reviewer: updateSchema,
  contentConfirmed: {
    type: Boolean,
    required: [true, 'Please validate whether content has been confirmed']
  },
  files: [Schema.Types.ObjectId]
}, { collection : 'articles' });

module.exports = ArticleSchema;