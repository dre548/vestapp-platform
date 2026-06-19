const db = require("./config/db");

const alterQuery = `ALTER TABLE investments ADD COLUMN last_claimed TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;

db.query(alterQuery, (err) => {
    if (err && !err.message.includes("Duplicate column name")) {
        console.error("Failed to upgrade:", err.message);
    } else {
        console.log("SUCCESS: Database is now tracking profit time!");
    }
    process.exit();
});