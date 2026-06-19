const db = require("./config/db");

// Add total_deposited and total_withdrawn columns to the users table
const upgradeQuery = `
  ALTER TABLE users 
  ADD COLUMN total_deposited DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN total_withdrawn DECIMAL(10,2) DEFAULT 0
`;

db.query(upgradeQuery, (err) => {
    if (err && !err.message.includes("Duplicate column name")) {
        console.error("Failed to upgrade:", err.message);
    } else {
        // Sync the new column with your initial 5000 deposit
        db.query("UPDATE users SET total_deposited = 5000 WHERE email = 'mainadennis548@gmail.com'");
        console.log("SUCCESS: Database upgraded with deposit tracking!");
    }
    process.exit();
});