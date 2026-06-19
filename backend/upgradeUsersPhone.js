const db = require("./config/db");

db.query("ALTER TABLE users ADD COLUMN phone VARCHAR(20)", (err) => {
    if (err && !err.message.includes("Duplicate column")) {
        console.error("Error:", err.message);
    } else {
        console.log("SUCCESS: Users table can now store phone numbers!");
    }
    process.exit();
});