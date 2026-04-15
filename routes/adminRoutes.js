const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post("/wallet/credit", adminController.creditWallet);
router.post("/wallet/debit", adminController.debitWallet);

module.exports = router;