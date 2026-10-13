// backend/src/routes/auth.routes.js
const { Router } = require("express");
const { register, login, getMe, updateMe, changePassword } = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/register",         register);
router.post("/login",            login);
router.get ("/me",     protect,  getMe);
router.put ("/me",     protect,  updateMe);
router.put ("/change-password", protect, changePassword);

module.exports = router;
