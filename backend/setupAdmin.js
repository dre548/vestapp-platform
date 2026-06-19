const db = require("./config/db");

const queries = [
  // 1. Give users a 'role' column (default is 'user')
  "ALTER TABLE users ADD COLUMN role VARCHAR(10) DEFAULT 'user'",
  
  // 2. Make your Dennis account the Admin!
  "UPDATE users SET role = 'admin' WHERE email = 'mainadennis548@gmail.com'",

  // 3. Create the waiting room for Deposits/Withdrawals
  `CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'deposit' or 'withdraw'
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

let completed = 0;

queries.forEach((query) => {
  db.query(query, (err) => {
    if (err && !err.message.includes("Duplicate column name")) {
      console.error("Error:", err.message);
    }
    completed++;
    if (completed === queries.length) {
      console.log("SUCCESS: Database is ready for Admin and Pending Transactions!");
      process.exit();
    }
  });
});