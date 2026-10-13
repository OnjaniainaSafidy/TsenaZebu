// backend/src/middlewares/upload.middleware.js
// Upload réel de photos (multer, stockage disque, un dossier par vendeur)

const path   = require("path");
const fs     = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads", "zebus");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
const MAX_FILES     = 6;

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Un dossier par vendeur : uploads/zebus/<sellerId>/
    const sellerDir = path.join(UPLOAD_ROOT, req.user._id.toString());
    fs.mkdirSync(sellerDir, { recursive: true });
    cb(null, sellerDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error("Format d'image non supporté (jpg, png ou webp uniquement)"));
  }
  cb(null, true);
};

const uploadZebuImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
});

module.exports = { uploadZebuImages, UPLOAD_ROOT, MAX_FILES, MAX_FILE_SIZE };
