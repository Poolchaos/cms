const mongoose = require('mongoose');

const PurchaseSchema = require('../schemas/purchase-schema');

var PurchaseModel = mongoose.model('PurchaseModel', PurchaseSchema);

module.exports = PurchaseModel;