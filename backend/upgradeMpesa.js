const db = require("./config/db");

db.query("ALTER TABLE transactions ADD COLUMN checkout_id VARCHAR(100)", (err) => {
    if (err && !err.message.includes("Duplicate column")) {
        console.error("Error:", err.message);
    } else {
        console.log("SUCCESS: Transactions can now track M-Pesa Checkout IDs!");
    }
    process.exit();
});