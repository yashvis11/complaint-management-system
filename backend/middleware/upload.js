
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Load backend environment variables
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

let storage;

if (process.env.STORAGE_TYPE === "cloudinary") {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Save images directly to Cloudinary
  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: "complaint-management-system",
      allowed_formats: ["jpg", "png", "webp"],
      public_id: crypto.randomBytes(16).toString("hex"),
    }),
  });
} else {
  // Keep the existing local storage functionality
  const uploadDir = path.join(__dirname, "..", "uploads");

  fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      cb(
        null,
        crypto.randomBytes(16).toString("hex") + ALLOWED[file.mimetype]
      );
    },
  });
}

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG or WebP images are allowed"));
    }
  },
});

// Return upload errors as JSON
module.exports = function uploadImage(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Image must be under 5 MB"
          : err.message;

      return res.status(400).json({
        success: false,
        message,
      });
    }

    next();
  });
};
