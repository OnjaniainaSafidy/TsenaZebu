// backend/src/routes/zebu.routes.js
// ⚠️  Routes statiques AVANT les routes dynamiques /:id

const { Router } = require("express");
const {
  getAllZebus, getZebuById, createZebu,
  updateZebu, deleteZebu, getMyZebus, getMyStats, uploadImages,
} = require("../controllers/zebu.controller");
const { protect, requireRole } = require("../middlewares/auth.middleware");
const { uploadZebuImages, MAX_FILES } = require("../middlewares/upload.middleware");
const { ROLES } = require("../config/constants");

const router = Router();

// Wrapper pour transformer les erreurs multer (taille, format, nombre de fichiers)
// en réponses JSON propres au lieu de planter le serveur.
const handleUpload = (req, res, next) => {
  uploadZebuImages.array("images", MAX_FILES)(req, res, (err) => {
    if (err) {
      return res.status(422).json({ success: false, message: err.message || "Échec de l'upload des images" });
    }
    next();
  });
};

// Routes statiques — déclarées AVANT /:id
router.get  ("/",          getAllZebus);
router.get  ("/my",        protect, requireRole(ROLES.SELLER, ROLES.ADMIN), getMyZebus);
router.get  ("/my/stats",  protect, requireRole(ROLES.SELLER, ROLES.ADMIN), getMyStats);
router.post ("/upload-images", protect, requireRole(ROLES.SELLER, ROLES.ADMIN), handleUpload, uploadImages);
router.post ("/",          protect, requireRole(ROLES.SELLER, ROLES.ADMIN), createZebu);

// Routes dynamiques /:id — déclarées APRÈS
router.get   ("/:id",      getZebuById);
router.put   ("/:id",      protect, updateZebu);
router.delete("/:id",      protect, deleteZebu);

module.exports = router;
