const db = require("./config/db");

db.query("ALTER TABLE products ADD COLUMN status VARCHAR(20) DEFAULT 'active'", (err) => {
    if (err && !err.message.includes("Duplicate column")) {
        console.error("Error:", err.message);
    } else {
        console.log("SUCCESS: Products can now be locked and deleted!");
    }
    process.exit();
});