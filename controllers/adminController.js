const Wallet = require("../models/Wallet");
const Ledger = require("../models/Ledger");

// CREDIT
exports.creditWallet = async (req, res) => {
  try {
    const { client_id, amount } = req.body;

    let wallet = await Wallet.findOne({ client_id });

    if (!wallet) {
      wallet = new Wallet({ client_id, balance: 0 });
    }

    wallet.balance += amount;
    await wallet.save();

    await Ledger.create({
      client_id,
      type: "credit",
      amount,
      balance_after: wallet.balance
    });

    res.json({ message: "Wallet credited", balance: wallet.balance });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DEBIT
exports.debitWallet = async (req, res) => {
  try {
    const { client_id, amount } = req.body;

    const wallet = await Wallet.findOne({ client_id });

    if (!wallet) {
      return res.status(404).json({ error: "Invalid client ID" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    wallet.balance -= amount;
    await wallet.save();

    await Ledger.create({
      client_id,
      type: "debit",
      amount,
      balance_after: wallet.balance
    });

    res.json({ message: "Wallet debited", balance: wallet.balance });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};