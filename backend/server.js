const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const db = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic Test Route
app.get("/", (req, res) => {
    res.json({ message: "Investment App API is running..." });
});
app.get('/', (req, res) => {
    res.status(200).send('Server is awake and running!');
});

// Routes (Must be defined BEFORE app.listen!)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/investments", require("./routes/investments"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/mpesa", require("./routes/mpesa"));
app.use("/api/admin", require("./routes/admin"));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});