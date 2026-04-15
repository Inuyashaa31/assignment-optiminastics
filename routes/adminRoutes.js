const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.post("/credit", adminController.creditWallet);
router.post("/debit", adminController.debitWallet);

module.exports = router;