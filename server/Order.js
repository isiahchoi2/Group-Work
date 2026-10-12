const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  copies: { type: Number, required: true },
  paperSize: { type: String, required: true },
  printType: { type: String, required: true },
  sides: { type: String, required: true },
  instructions: { type: String },
  paymentMethod: { type: String, required: true },
  estimatedCost: { type: Number, required: true },
  status: { type: String, default: "Pending" } // <--- MUST have this!
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);