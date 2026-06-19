const db = require("./config/db");

const seedData = `
    INSERT INTO products (name, price, daily_profit, duration_days, status) VALUES 
    ('Starter Package', 1000, 50, 30, 'active'),
    ('Pro Miner', 5000, 300, 30, 'active'),
    ('VIP Server', 15000, 1000, 30, 'active')
    ON DUPLICATE KEY UPDATE status='active';
`;

db.query(seedData, (err) => {
    if (err) console.error("Seeding failed:", err.message);
    else console.log("SUCCESS: Test products added to database!");
    process.exit();
});