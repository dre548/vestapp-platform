const express = require("express");
const util = require("util");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// Middleware to double-check they are an admin
const verifyAdmin = async (req, res, next) => {
    try {
        const users = await query("SELECT role FROM users WHERE id = ?", [req.user.id]);
        if (users.length === 0 || users[0].role !== 'admin') {
            return res.status(403).json({ message: "Access Denied: Admins Only." });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: "Admin verification failed." });
    }
};

// ==========================================
// 📊 GLOBAL PLATFORM STATS
// ==========================================

// GET: All global transactions for the Admin Dashboard
router.get("/transactions", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const results = await query(`
            SELECT t.id, t.type, t.amount, t.status, t.created_at, u.username, u.email 
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Global Platform Overview (Investments & Liquidity)
router.get("/overview", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const investments = await query(`
            SELECT i.id, i.amount_paid, i.created_at, p.name as product_name, u.username, u.email
            FROM investments i
            JOIN products p ON i.product_id = p.id
            JOIN users u ON i.user_id = u.id
            WHERE i.status = 'active'
            ORDER BY i.created_at DESC
        `);
        const investedResult = await query("SELECT SUM(amount_paid) as total_invested FROM investments WHERE status = 'active'");
        const balanceResult = await query("SELECT SUM(balance) as total_balances FROM users");

        res.json({
            investments: investments,
            totalInvested: investedResult[0].total_invested || 0,
            totalUserBalances: balanceResult[0].total_balances || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 🛍️ PRODUCT MANAGEMENT
// ==========================================

// POST: Add a New Product (Wired to new React Admin Panel)
router.post("/products", verifyToken, verifyAdmin, async (req, res) => {
    // If your frontend sends daily_profit and duration, we auto-calc total return
    const { name, price, daily_profit, duration_days } = req.body;
    const total_return = Number(daily_profit) * Number(duration_days);

    try {
        await query(
            "INSERT INTO products (name, price, daily_profit, total_return, duration_days) VALUES (?, ?, ?, ?, ?)",
            [name, price, daily_profit, total_return, duration_days]
        );
        res.status(201).json({ message: "Product added successfully!" });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ message: "Failed to add product." });
    }
});

// DELETE: Remove a Product (Wired to new React Admin Panel)
router.delete("/products/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        await query("DELETE FROM products WHERE id = ?", [req.params.id]);
        res.json({ message: "Product deleted successfully!" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Failed to delete product." });
    }
});

// PUT: Edit a product's details
router.put("/edit-product/:id", verifyToken, verifyAdmin, async (req, res) => {
    const { name, price, daily_profit, duration_days } = req.body;
    const total_return = Number(daily_profit) * Number(duration_days);
    
    try {
        await query(
            "UPDATE products SET name=?, price=?, daily_profit=?, duration_days=?, total_return=? WHERE id=?",
            [name, price, daily_profit, duration_days, total_return, req.params.id]
        );
        res.json({ message: "Product updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Lock or Unlock a product
router.put("/toggle-product/:id", verifyToken, verifyAdmin, async (req, res) => {
    const { status } = req.body; // 'active' or 'locked'
    try {
        await query("UPDATE products SET status = ? WHERE id = ?", [status, req.params.id]);
        res.json({ message: `Product is now ${status}!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 💸 ADMIN WITHDRAWAL & PAYOUT CONTROLS 💸
// ==========================================

// GET: Fetch all pending withdrawals
router.get("/withdrawals", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const pending = await query(`
            SELECT t.id, t.amount, t.created_at, u.username, u.phone, u.balance 
            FROM transactions t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.type = 'withdraw' AND t.status = 'pending'
            ORDER BY t.created_at ASC
        `);
        res.json(pending);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch withdrawals." });
    }
});

// POST: Approve & Payout Withdrawal (M-Pesa B2C Logic)
router.post("/payout/:id", verifyToken, verifyAdmin, async (req, res) => {
    const txId = req.params.id;

    try {
        // 1. Fetch transaction details
        const txRes = await query("SELECT * FROM transactions WHERE id = ? AND status = 'pending'", [txId]);
        if (txRes.length === 0) return res.status(404).json({ message: "Transaction not found or already processed." });
        
        const tx = txRes[0];
        const userId = tx.user_id;
        const amount = tx.amount;

        // 2. Fetch user details
        const userRes = await query("SELECT phone, balance FROM users WHERE id = ?", [userId]);
        const userPhone = userRes[0].phone;

        // Anti-Fraud check
        if (Number(userRes[0].balance) < Number(amount)) {
            await query("UPDATE transactions SET status = 'rejected' WHERE id = ?", [txId]);
            return res.status(400).json({ message: "User has insufficient funds. Request rejected." });
        }

        // ------------------------------------------------------------------
        // THE M-PESA B2C API INTEGRATION POINT (Simulated for testing)
        // ------------------------------------------------------------------
        console.log(`\n💸 M-PESA B2C INITIATED: Sending KES ${amount} to ${userPhone}...`);
        
        const isMpesaSuccess = true; 

        if (isMpesaSuccess) {
            // Deduct the money from their wallet
            await query("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, userId]);
            // Mark transaction as approved
            await query("UPDATE transactions SET status = 'approved' WHERE id = ?", [txId]);
            // Update total withdrawn stat
            await query("UPDATE users SET total_withdrawn = total_withdrawn + ? WHERE id = ?", [amount, userId]);
            
            console.log("✅ Payout successful!");
            res.json({ message: `Successfully paid KES ${amount} to ${userPhone}.` });
        } else {
            res.status(500).json({ message: "Safaricom B2C API failed." });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred during payout." });
    }
});

// POST: Reject Withdrawal (Refund the money)
router.post("/reject/:id", verifyToken, verifyAdmin, async (req, res) => {
    const txId = req.params.id;

    try {
        const txRes = await query("SELECT * FROM transactions WHERE id = ? AND status = 'pending'", [txId]);
        if (txRes.length === 0) return res.status(404).json({ message: "Transaction not found." });

        const tx = txRes[0];

        // Mark as rejected
        await query("UPDATE transactions SET status = 'rejected' WHERE id = ?", [txId]);
        
        // Refund the locked money back to the user's available balance
        await query("UPDATE users SET balance = balance + ? WHERE id = ?", [tx.amount, tx.user_id]);

        res.json({ message: "Withdrawal rejected. Funds refunded to user." });
    } catch (error) {
        res.status(500).json({ message: "Failed to reject." });
    }
});

module.exports = router;