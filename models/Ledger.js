const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
  client_id: { type: String, required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  amount: { type: Number, required: true },
  balance_after: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Ledger", ledgerSchema);