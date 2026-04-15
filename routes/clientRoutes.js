const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");

router.get("/balance/:client_id", clientController.getBalance);
router.post("/order", clientController.createOrder);

module.exports = router;