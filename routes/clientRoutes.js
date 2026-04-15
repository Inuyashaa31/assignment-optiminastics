const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");

//router.get("/balance/:client_id", clientController.getBalance);
router.get("/balance", clientController.getBalance);
router.post("/order", clientController.createOrder);
router.get("/order/:order_id", clientController.getOrder);

module.exports = router;