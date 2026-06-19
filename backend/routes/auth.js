const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const util = require("util");
const db = require("../config/db");

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// ----------------------------------------------------
// POST: Register User
// ----------------------------------------------------
router.post("/register", async (req, res) => {
    const { username, email, phone, password, sponsorCode } = req.body;

    try {
        const existingUser = await query("SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Account with this email or phone already exists. Please log in." });
        }

        let referredBy = null;
        if (sponsorCode) {
            const sponsor = await query("SELECT id FROM users WHERE referral_code = ?", [sponsorCode]);
            if (sponsor.length > 0) referredBy = sponsor[0].id;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const myCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const insertQuery = "INSERT INTO users (username, email, phone, password, otp, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?)";
        await query(insertQuery, [username, email, phone, hashedPassword, otp, myCode, referredBy]);

        console.log(`\n=========================================`);
        console.log(` 🔔 NEW REGISTRATION - SMS SENT TO ${phone}`);
        console.log(` 🔑 OTP CODE: ${otp}`);
        console.log(`=========================================\n`);

        res.status(201).json({ 
            message: "Account created! Check your phone for the verification code.", 
            phone: phone,
            devOtp: otp // Developer Cheat Code
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error during registration." });
    }
});

// ----------------------------------------------------
// POST: Verify OTP
// ----------------------------------------------------
router.post("/verify-otp", async (req, res) => {
    const { phone, otp } = req.body;
    try {
        const users = await query("SELECT * FROM users WHERE phone = ?", [phone]);
        if (users.length === 0) return res.status(404).json({ message: "User not found." });

        if (users[0].otp !== otp) return res.status(400).json({ message: "Invalid OTP code." });

        await query("UPDATE users SET is_verified = 1, otp = NULL WHERE phone = ?", [phone]);
        res.json({ message: "Phone number verified successfully!" });

    } catch (err) {
        res.status(500).json({ message: "Server error during verification." });
    }
});

// ----------------------------------------------------
// POST: Login User
// ----------------------------------------------------
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const users = await query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(400).json({ message: "Invalid credentials." });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

        if (!user.is_verified) {
            return res.status(403).json({ 
                message: "Account not verified. Redirecting to verification...", 
                needsVerification: true, 
                phone: user.phone 
            });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: { id: user.id, username: user.username, email: user.email, phone: user.phone, role: user.role, balance: user.balance, referral_code: user.referral_code }
        });

    } catch (err) {
        res.status(500).json({ message: "Server error during login." });
    }
});

// ----------------------------------------------------
// POST: Forgot Password (Generate OTP)
// ----------------------------------------------------
router.post("/forgot-password", async (req, res) => {
    const { phone } = req.body;
    try {
        const users = await query("SELECT * FROM users WHERE phone = ?", [phone]);
        if (users.length === 0) return res.status(404).json({ message: "No account found with that phone number." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await query("UPDATE users SET otp = ? WHERE phone = ?", [otp, phone]);

        console.log(`\n=========================================`);
        console.log(` 🔔 PASSWORD RESET - SMS SENT TO ${phone}`);
        console.log(` 🔑 OTP CODE: ${otp}`);
        console.log(`=========================================\n`);

        res.json({ message: "Password reset OTP sent!", devOtp: otp });
    } catch (err) {
        res.status(500).json({ message: "Failed to initiate password reset." });
    }
});

// ----------------------------------------------------
// POST: Reset Password
// ----------------------------------------------------
router.post("/reset-password", async (req, res) => {
    const { phone, otp, newPassword } = req.body;
    try {
        const users = await query("SELECT * FROM users WHERE phone = ?", [phone]);
        if (users.length === 0) return res.status(404).json({ message: "User not found." });

        if (users[0].otp !== otp) return res.status(400).json({ message: "Invalid or expired OTP." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await query("UPDATE users SET password = ?, otp = NULL, is_verified = 1 WHERE phone = ?", [hashedPassword, phone]);

        res.json({ message: "Password has been reset successfully! You can now log in." });
    } catch (err) {
        res.status(500).json({ message: "Failed to reset password." });
    }
});

module.exports = router;