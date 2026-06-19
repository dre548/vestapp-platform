const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // 1. Grab the token from the frontend request
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

    try {
        // 2. Verify the token using our secret key
        const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        
        // 3. Attach the user's ID to the request and let them pass
        req.user = verified; 
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

module.exports = verifyToken;