const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    // Random name, so the user's filename is never trusted or reused
    filename: (req, file, cb) =>
      cb(null, crypto.randomBytes(16).toString("hex") + ALLOWED[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) =>
    ALLOWED[file.mimetype]
      ? cb(null, true)
      : cb(new Error("Only JPG, PNG or WebP images are allowed")),
});

// Wrapper so upload errors come back as JSON like your other errors
module.exports = function uploadImage(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Image must be under 5 MB"
          : err.message;
      return res.status(400).json({ success: false, message });
    }
    next();
  });
};
