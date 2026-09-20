const authMiddleware = (req, res, next) => {
  console.log("Session in middleware:", req.session);
  console.log("User ID:", req.session?.userId);
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      message: "Please login first",
    });
  }
  next();
};

module.exports = { authMiddleware };
