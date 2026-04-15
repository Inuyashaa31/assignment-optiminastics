const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  client_id: { type: String, required: true },
  order_id: { type: String, required: true },
  amount: { type: Number, required: true },
  fulfillment_id: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);