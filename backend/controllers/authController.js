const bcrypt = require("bcrypt");
const db = require("../config/db");

// Check whether a user is already registered
const checkEmail = async (userData) => {
  const checkEmailQuery = `SELECT * FROM Users WHERE email = ?`;

  const [result] = await db.query(checkEmailQuery, [userData.email]);

  return result;
};

// Register a new user
const createUser = async (userData) => {
  const createQuery = `
        INSERT INTO Users
        (name, email, password, role, department, is_verified)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

  // Students/users and admins are verified automatically.
  // Staff members need admin approval.
  const isVerified = userData.role === "staff" ? 0 : 1;

  const values = [
    userData.name,
    userData.email,
    userData.hashed_password,
    userData.role,
    userData.department,
    isVerified,
  ];

  const [result] = await db.query(createQuery, values);

  return result;
};

// Registration controller
const registerUser = async (req, res) => {
  const userData = {
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    role: req.body.role,
    department: req.body.department,
  };

  if (
    !userData.email ||
    !userData.password ||
    !userData.name ||
    !userData.role ||
    !userData.department
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill all the required fields",
    });
  }

  // Only allow the roles supported by this application.
  if (!["user", "staff"].includes(userData.role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid registration role",
    });
  }

  try {
    const checkEmailResult = await checkEmail(userData);

    if (checkEmailResult.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User is already registered",
      });
    }

    // Hash password
    userData.hashed_password = await bcrypt.hash(userData.password, 10);

    const resultRegister = await createUser(userData);

    return res.status(201).json({
      success: true,
      message:
        userData.role === "staff"
          ? "Staff registration successful. Please wait for admin approval."
          : "User registered successfully",
      userId: resultRegister.insertId,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Error in registering user",
    });
  }
};

// Login controller
const loginUser = async (req, res) => {
  try {
    const userData = {
      email: req.body.email,
      password: req.body.password,
    };

    if (!userData.email || !userData.password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the required fields",
      });
    }

    const checkEmailResult = await checkEmail(userData);

    if (checkEmailResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = checkEmailResult[0];

    // Compare entered password with hashed password
    const compareResult = await bcrypt.compare(
      userData.password,
      user.password,
    );

    if (!compareResult) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Block staff members who have not been approved
    if (user.role === "staff" && Number(user.is_verified) !== 1) {
      return res.status(403).json({
        success: false,
        message: "Your staff account is awaiting admin approval.",
      });
    }

    // Regenerate session after successful authentication
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);

        return res.status(500).json({
          success: false,
          message: "Unable to create login session",
        });
      }

      req.session.userId = user.id;
      req.session.name = user.name;
      req.session.role = user.role;
      req.session.user_role = user.role;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError);

          return res.status(500).json({
            success: false,
            message: "Unable to save login session",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            department: user.department,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// Logout controller
const logoutUser = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    res.clearCookie("connect.sid");

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};
