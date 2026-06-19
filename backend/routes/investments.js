const express = require("express");
const jwt = require("jsonwebtoken");
const util = require("util");
const db = require("../config/db");

const router = express.Router();

// This magic line lets us use modern async/await with your MySQL database!
const query = util.promisify(db.query).bind(db);

// Middleware to protect these routes
const verifyToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access Denied" });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

// ----------------------------------------------------
// GET: Fetch All Available Products
// ----------------------------------------------------
router.get("/products", verifyToken, async (req, res) => {
    try {
        const products = await query("SELECT * FROM products WHERE status = 'active' ORDER BY price ASC");
        res.json(products);
    } catch (error) {
        console.error("Failed to fetch products:", error);
        res.status(500).json({ message: "Failed to load products." });
    }
});

// ----------------------------------------------------
// POST: Buy Product & Distribute 3-Tier Commissions
// ----------------------------------------------------
router.post("/buy", verifyToken, async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;

    try {
        // 1. Fetch Product and User
        const products = await query("SELECT * FROM products WHERE id = ?", [productId]);
        const users = await query("SELECT * FROM users WHERE id = ?", [userId]);

        if (products.length === 0) return res.status(404).json({ message: "Product not found." });
        if (users.length === 0) return res.status(404).json({ message: "User not found." });

        const product = products[0];
        const user = users[0];

        if (product.status === 'locked') {
            return res.status(400).json({ message: "This product is currently locked." });
        }

        if (Number(user.balance) < Number(product.price)) {
            return res.status(400).json({ message: "Insufficient balance to buy this product." });
        }

        // 2. Deduct Balance & Create Investment
        await query("UPDATE users SET balance = balance - ? WHERE id = ?", [product.price, userId]);
        
        const invRes = await query(
            "INSERT INTO investments (user_id, product_id, name, daily_profit, duration_days, last_claimed) VALUES (?, ?, ?, ?, ?, NOW())", 
            [userId, product.id, product.name, product.daily_profit, product.duration_days]
        );
        const investmentId = invRes.insertId;

        // ------------------------------------------------
        // 3. THE COMMISSION ENGINE (8% -> 4% -> 2%)
        // ------------------------------------------------
        const rates = [0.08, 0.04, 0.02]; // Level 1, Level 2, Level 3
        let currentUserId = userId;

        for (let level = 1; level <= 3; level++) {
            // Find who invited the current user
            const u = await query("SELECT referred_by FROM users WHERE id = ?", [currentUserId]);
            
            // If they don't have a referrer, stop the chain!
            if (u.length === 0 || !u[0].referred_by) break; 

            const sponsorId = u[0].referred_by;
            const commissionAmount = Number(product.price) * rates[level - 1];

            // Pay the sponsor their commission instantly
            await query("UPDATE users SET balance = balance + ? WHERE id = ?", [commissionAmount, sponsorId]);

            // Log the payout in the commissions ledger
            await query(
                "INSERT INTO commissions (receiver_id, buyer_id, investment_id, level, amount) VALUES (?, ?, ?, ?, ?)",
                [sponsorId, userId, investmentId, level, commissionAmount]
            );

            // Log it in the transactions history so they see it in their wallet
            await query(
                "INSERT INTO transactions (user_id, type, amount, status) VALUES (?, 'commission', ?, 'approved')",
                [sponsorId, commissionAmount]
            );

            // Move up the chain to find the NEXT sponsor
            currentUserId = sponsorId;
        }

        res.json({ message: "Product purchased successfully! Commissions have been paid." });

    } catch (error) {
        console.error("Purchase error:", error);
        res.status(500).json({ message: "An error occurred during purchase." });
    }
});

// ----------------------------------------------------
// POST: Claim Daily Earnings
// ----------------------------------------------------
router.post("/claim/:id", verifyToken, async (req, res) => {
    const investId = req.params.id;
    const userId = req.user.id;

    try {
        const investments = await query("SELECT * FROM investments WHERE id = ? AND user_id = ?", [investId, userId]);
        if (investments.length === 0) return res.status(404).json({ message: "Investment not found." });

        const inv = investments[0];
        const lastClaimed = new Date(inv.last_claimed).getTime();
        const now = Date.now();
        const hoursPassed = (now - lastClaimed) / (1000 * 60 * 60);

        if (hoursPassed < 24) {
            return res.status(400).json({ message: "You must wait 24 hours between claims." });
        }

        // Add daily profit to user balance
        await query("UPDATE users SET balance = balance + ? WHERE id = ?", [inv.daily_profit, userId]);
        
        // Update the last claimed timer
        await query("UPDATE investments SET last_claimed = NOW() WHERE id = ?", [investId]);

        // Log the earning in the wallet history
        await query(
            "INSERT INTO transactions (user_id, type, amount, status) VALUES (?, 'earning', ?, 'approved')",
            [userId, inv.daily_profit]
        );

        res.json({ message: `Successfully claimed KES ${inv.daily_profit}!` });

    } catch (error) {
        console.error("Claim error:", error);
        res.status(500).json({ message: "Failed to claim earnings." });
    }
});
// ----------------------------------------------------
// GET: Fetch User's Active Investments
// ----------------------------------------------------
router.get("/my-investments", verifyToken, async (req, res) => {
    try {
        const myInvestments = await query(
            "SELECT * FROM investments WHERE user_id = ? ORDER BY created_at DESC", 
            [req.user.id]
        );
        res.json(myInvestments);
    } catch (error) {
        console.error("Fetch investments error:", error);
        res.status(500).json({ message: "Failed to load your devices." });
    }
});
module.exports = router;