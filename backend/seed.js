const db = require("./config/db");

const insertQuery = `
  INSERT INTO products (name, image, price, daily_profit, duration_days, total_profit) VALUES
  ('Starter Pack', 'starter.jpg', 1000, 50, 30, 1500),
  ('Pro Tier', 'pro.jpg', 5000, 300, 30, 9000),
  ('VIP Elite', 'vip.jpg', 15000, 1000, 30, 30000)
`;

db.query(insertQuery, (err, result) => {
    if (err) {
        console.error("Failed to insert data:", err.message);
    } else {
        console.log("SUCCESS: 3 Investment Products added to the database!");
    }
    process.exit(); // Closes the script automatically
});