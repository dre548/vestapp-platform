const mysql = require("mysql2");
require("dotenv").config();

// Tell the app to use the Render Environment Variable FIRST. 
// If it isn't there, fall back to localhost for your local testing.
const dbConfig = process.env.DATABASE_URL || {
    host: "localhost",
    user: "root",
    password: "dennis", // your local password
    database: "investment_app" // your local database name
};

const db = mysql.createPool(dbConfig);

// This will explicitly test the connection and print a clear message to the Render logs
db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database connection failed! Error:", err.message);
    } else {
        console.log("✅ Successfully connected to TiDB Cloud Database!");
        connection.release();
    }
});

module.exports = db;