const db = require("./config/db");

console.log("\n🔍 Fetching Live Database Records...\n");

// 1. Check the Users table (to see your new balance)
db.query("SELECT id, username, email, balance FROM users", (err, users) => {
    if (err) return console.error(err.message);
    
    console.log("=== USERS TABLE ===");
    console.table(users);

    // 2. Check the Investments table (to see your receipt)
    db.query("SELECT * FROM investments", (err, investments) => {
        if (err) return console.error(err.message);
        
        console.log("\n=== INVESTMENTS TABLE ===");
        console.table(investments);
        
        process.exit(); // Close the script
    });
});