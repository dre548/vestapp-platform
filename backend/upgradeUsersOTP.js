const db = require("./config/db");

const query = "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE, ADD COLUMN otp VARCHAR(10)";

db.query(query, (err) => {
    if (err && !err.message.includes("Duplicate column")) {
        console.error("Error:", err.message);
    } else {
        console.log("SUCCESS: Users table can now handle OTP verification!");
    }
    process.exit();
});