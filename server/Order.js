const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: String,
  copies: Number,
  paperSize: String,
  printType: String,
  sides: String,
  instructions: String,
  paymentMethod: String,
  estimatedCost: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);