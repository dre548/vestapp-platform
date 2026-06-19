const express = require("express");
const axios = require("axios");
const db = require("../config/db");

const router = express.Router();

// 1. Middleware to generate the M-Pesa Security Token
const generateToken = async (req, res, next) => {
    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");

    try {
        const response = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
            headers: { Authorization: `Basic ${auth}` }
        });
        req.token = response.data.access_token;
        next();
    } catch (error) {
        console.error("Token generation failed:", error.response?.data || error.message);
        res.status(400).json({ message: "Failed to generate M-Pesa token" });
    }
};

// 2. POST: Initiate STK Push on the User's Phone
router.post("/stkpush", generateToken, async (req, res) => {
    const { phone, amount, userId } = req.body; 
    
    if (!phone) return res.status(400).json({ message: "Phone number is missing." });
    
    let formattedPhone = phone;
    if (phone.startsWith("0")) formattedPhone = `254${phone.slice(1)}`;
    if (phone.startsWith("+254")) formattedPhone = phone.slice(1);

    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    
    const date = new Date();
    const timestamp = date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) + ("0" + date.getMinutes()).slice(-2) + ("0" + date.getSeconds()).slice(-2);

    const password = Buffer.from(shortCode + passkey + timestamp).toString("base64");

    try {
        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                BusinessShortCode: shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: formattedPhone,
                PartyB: shortCode,
                PhoneNumber: formattedPhone,
                CallBackURL: "https://unsorted-batboy-confront.ngrok-free.dev/api/mpesa/callback", // <-- Make sure your Ngrok is updated here!
                AccountReference: `User_${userId}`,
                TransactionDesc: "Wallet Deposit"
            },
            { headers: { Authorization: `Bearer ${req.token}` } }
        );

        const checkoutId = response.data.CheckoutRequestID; // <-- Grab the unique ID!

        // Save the pending transaction WITH the unique Checkout ID
        db.query("INSERT INTO transactions (user_id, type, amount, status, checkout_id) VALUES (?, 'deposit', ?, 'pending', ?)", 
        [userId, amount, checkoutId], (err) => {
            if (err) console.error("Failed to log pending deposit", err);
            res.json({ message: "STK Push sent! Please check your phone.", CheckoutRequestID: checkoutId });
        });

    } catch (error) {
        console.error("STK Push error:", error.response?.data || error.message);
        res.status(500).json({ message: "Failed to initiate M-Pesa payment." });
    }
});

// 3. POST: The Webhook Callback
router.post("/callback", (req, res) => {
    console.log("\n💰 M-PESA CALLBACK RECEIVED 💰");
    
    const callbackData = req.body.Body?.stkCallback;
    if (!callbackData) return res.status(400).json({ message: "Invalid callback" });

    res.json({ message: "Callback received securely." }); 

    const checkoutId = callbackData.CheckoutRequestID; // <-- Extract the unique ID from Safaricom

    if (callbackData.ResultCode === 0) {
        const metadata = callbackData.CallbackMetadata.Item;
        const amount = metadata.find(obj => obj.Name === 'Amount').Value;
        
        console.log(`✅ Success! Payment arrived for Checkout ID: ${checkoutId}`);

        // FIX: Find the exact transaction using the Checkout ID, NOT the phone number!
        db.query("SELECT user_id FROM transactions WHERE checkout_id = ? LIMIT 1", [checkoutId], (err, txResults) => {
            if (err || txResults.length === 0) return console.error("❌ Could not find matching pending transaction.");
            
            const userId = txResults[0].user_id;

            // 1. Approve the specific transaction
            db.query("UPDATE transactions SET status = 'approved' WHERE checkout_id = ?", [checkoutId]);
            
            // 2. Add the money to the user who clicked the button!
            db.query("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId]);
            
            console.log("💳 Wallet successfully updated!");
        });

    } else {
        console.log("❌ Payment Failed or Cancelled by User:", callbackData.ResultDesc);
        // Safely reject the specific transaction using the Checkout ID
        db.query("UPDATE transactions SET status = 'rejected' WHERE checkout_id = ?", [checkoutId]);
    }
});

module.exports = router;