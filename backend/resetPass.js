const db = require("./config/db");
const bcrypt = require("bcryptjs"); // Used to safely encrypt the new password

const reset = async () => {
    // 1. Encrypt the new password "123456"
    const newPassword = await bcrypt.hash("123456", 10);
    
    // 2. Update your specific Admin account
    db.query("UPDATE users SET password = ? WHERE email = 'mainadennis548@gmail.com'", [newPassword], (err) => {
        if (err) {
            console.error("Failed to reset:", err.message);
        } else {
            console.log("SUCCESS: Your password is now 123456");
        }
        process.exit();
    });
};

reset();