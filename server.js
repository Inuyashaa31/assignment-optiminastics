const express = require("express");
const connectDB = require("./db");

const adminRoutes = require("./routes/adminRoutes");
const clientRoutes = require("./routes/clientRoutes");

const app = express();

app.use(express.json());

connectDB();

// Routes
app.use("/admin", adminRoutes);
app.use("/client", clientRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});