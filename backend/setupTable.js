const db = require("./config/db");

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS investments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

db.query(createTableQuery, (err, result) => {
    if (err) {
        console.error("Failed to create table:", err.message);
    } else {
        console.log("SUCCESS: Investments table is ready!");
    }
    process.exit();
});