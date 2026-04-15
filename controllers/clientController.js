const mongoose = require("mongoose");
const axios = require("axios");

const Wallet = require("../models/Wallet");
const Ledger = require("../models/Ledger");
const Order = require("../models/Order");

// CHECK BALANCE
exports.getBalance = async (req, res) => {
  try {
    const { client_id } = req.params;

    const wallet = await Wallet.findOne({ client_id });

    if (!wallet) {
      return res.status(404).json({ error: "Invalid client ID" });
    }

    res.json({ balance: wallet.balance });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE ORDER (ATOMIC)
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { client_id, amount, order_id } = req.body;

    session.startTransaction();

    const wallet = await Wallet.findOne({ client_id }).session(session);

    if (!wallet) {
      throw new Error("Invalid client ID");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient funds");
    }

    // Deduct balance
    wallet.balance -= amount;
    await wallet.save({ session });

    // Ledger entry
    await Ledger.create([{
      client_id,
      type: "debit",
      amount,
      balance_after: wallet.balance
    }], { session });

    // External API call
    let fulfillment_id;

    try {
      const response = await axios.post(
        "https://jsonplaceholder.typicode.com/posts",
        {
          userId: client_id,   // mapped
          title: order_id      // mapped
        }
      );

      fulfillment_id = response.data.id;

    } catch (err) {
      throw new Error("External API failed");
    }

    // Save order
    await Order.create([{
      client_id,
      order_id,
      amount,
      fulfillment_id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Order created successfully",
      fulfillment_id
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({ error: err.message });
  }
};