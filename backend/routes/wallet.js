const express = require("express");
const jwt = require("jsonwebtoken");
const util = require("util");
const db = require("../config/db");

const router = express.Router();
const query = util.promisify(db.query).bind(db);

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

// GET: Fetch Wallet Balance
router.get("/balance", verifyToken, async (req, res) => {
    try {
        const results = await query("SELECT balance FROM users WHERE id = ?", [req.user.id]);
        if (results.length === 0) return res.status(404).json({ message: "User not found" });
        res.json({ balance: results[0].balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch Transaction History
router.get("/transactions", verifyToken, async (req, res) => {
    try {
        const results = await query("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------------
// NEW POST: Request a Withdrawal
// ----------------------------------------------------------------
router.post("/withdraw", verifyToken, async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 100) {
        return res.status(400).json({ message: "Minimum withdrawal amount is KES 100." });
    }

    try {
        // 1. Check current balance
        const userRes = await query("SELECT balance FROM users WHERE id = ?", [userId]);
        const balance = Number(userRes[0].balance);

        // 2. Check for money that is already locked in pending withdrawals
        const pendingRes = await query(
            "SELECT SUM(amount) as pendingTotal FROM transactions WHERE user_id = ? AND type = 'withdraw' AND status = 'pending'", 
            [userId]
        );
        const pendingTotal = Number(pendingRes[0].pendingTotal || 0);

        // 3. Prevent them from withdrawing more than they actually have available
        if (balance - pendingTotal < amount) {
            return res.status(400).json({ message: "Insufficient available funds." });
        }

        // 4. Log the pending withdrawal request
        await query(
            "INSERT INTO transactions (user_id, type, amount, status) VALUES (?, 'withdraw', ?, 'pending')",
            [userId, amount]
        );

        res.json({ message: "Withdrawal request submitted! Waiting for Admin approval." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to process withdrawal." });
    }
});

// GET: Fetch Referral Tree (From our previous MLM build)
router.get("/referrals", verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const commRes = await query("SELECT SUM(amount) as total FROM commissions WHERE receiver_id = ?", [userId]);
        const totalCommission = commRes[0].total || 0;

        const level1 = await query("SELECT id, username, phone, created_at FROM users WHERE referred_by = ?", [userId]);
        const level1Ids = level1.map(u => u.id);

        let level2 = [];
        let level2Ids = [];
        if (level1Ids.length > 0) {
            level2 = await query("SELECT id, username, phone, created_at FROM users WHERE referred_by IN (?)", [level1Ids]);
            level2Ids = level2.map(u => u.id);
        }

        let level3 = [];
        if (level2Ids.length > 0) {
            level3 = await query("SELECT id, username, phone, created_at FROM users WHERE referred_by IN (?)", [level2Ids]);
        }

        res.json({
            totalCommission,
            count: level1.length + level2.length + level3.length,
            team: { level1, level2, level3 }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;