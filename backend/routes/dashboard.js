const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
    const userId = req.user.id;

    // 1. Get User Stats
    db.query("SELECT balance, total_deposited, total_withdrawn FROM users WHERE id = ?", [userId], (err, userStats) => {
        if (err) return res.status(500).json({ error: err.message });

        // 2. Get Active Investments (Joining the investments and products tables)
        
        const investQuery = `
            SELECT i.id, i.amount_paid, i.created_at, i.last_claimed, p.name, p.daily_profit, p.duration_days 
            FROM investments i
            JOIN products p ON i.product_id = p.id
            WHERE i.user_id = ? AND i.status = 'active'
            ORDER BY i.created_at DESC
        `;

        db.query(investQuery, [userId], (err, investments) => {
            if (err) return res.status(500).json({ error: err.message });

            // Send everything back to the frontend in one neat package
            res.json({
                stats: userStats[0],
                investments: investments
            });
        });
    });
});

module.exports = router;