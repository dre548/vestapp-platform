const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

const router = express.Router();

// 1. Ensure an 'uploads' folder exists on your server
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. Configure Multer (Tell it where to save files and what to name them)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        // Name the file securely (e.g., prod_1684939201.jpg)
        cb(null, "prod_" + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 3. The actual API Route
router.post("/product/:id", upload.single("imageFile"), (req, res) => {
    const productId = req.params.id;
    const { imageUrl } = req.body;

    let finalImage = null;

    if (req.file) {
        // Option A: They uploaded a file from their computer
        finalImage = "uploads/" + req.file.filename;
    } else if (imageUrl && imageUrl.trim() !== "") {
        // Option B: They pasted a web link
        finalImage = imageUrl;
    }

    if (!finalImage) {
        return res.status(400).json({ message: "Please provide a web link or upload a file." });
    }

    // 4. Update the database
    db.query("UPDATE products SET image = ? WHERE id = ?", [finalImage, productId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Image updated successfully!", newImage: finalImage });
    });
});

module.exports = router;