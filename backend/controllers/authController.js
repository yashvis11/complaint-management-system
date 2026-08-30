const db = require("../config/db");

// Login user
async function login(req, res) {
    try {

        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });

        }

        // Find user
        const [users] = await db.query(
            `
            SELECT id, name, email, role
            FROM Users
            WHERE email = ? AND password = ?
            `,
            [email, password]
        );

        // Invalid credentials
        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }

        const user = users[0];

        res.json({
            success: true,
            message: "Login successful",
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });

    }
}


module.exports = {
    login
};