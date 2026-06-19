const db = require("./config/db");

const createHistoryTable = `
  CREATE TABLE IF NOT EXISTS claim_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investment_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

db.query(createHistoryTable, (err) => {
    if (err) {
        console.error("Failed to create table:", err.message);
    } else {
        console.log("SUCCESS: Claim History ledger is ready!");
    }
    process.exit();
});