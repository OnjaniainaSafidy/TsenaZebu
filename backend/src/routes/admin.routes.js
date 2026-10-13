// backend/src/routes/admin.routes.js
const { Router } = require("express");
const {
  getDashboard,
  getUsers, banUser, changeUserRole, updateUserName,
  softDeleteUser, getDeletedUsers, restoreUser,
  getAdminZebus, updateZebuStatus,
  getAdminOrders, updateAdminOrderStatus,
} = require("../controllers/admin.controller");
const { protect, requireRole } = require("../middlewares/auth.middleware");
const { ROLES } = require("../config/constants");

const router = Router();
const admin  = [protect, requireRole(ROLES.ADMIN)];

// Dashboard
router.get("/dashboard",              ...admin, getDashboard);

// Utilisateurs actifs — statiques AVANT dynamiques
router.get   ("/users",               ...admin, getUsers);
router.get   ("/users/deleted",       ...admin, getDeletedUsers);
router.post  ("/users/:id/restore",   ...admin, restoreUser);
router.patch ("/users/:id/name",      ...admin, updateUserName);   // ← nouveau
router.patch ("/users/:id/ban",       ...admin, banUser);
router.patch ("/users/:id/role",      ...admin, changeUserRole);
router.delete("/users/:id",           ...admin, softDeleteUser);

// Annonces
router.get   ("/zebus",               ...admin, getAdminZebus);
router.patch ("/zebus/:id/status",    ...admin, updateZebuStatus);

// Commandes
router.get   ("/orders",              ...admin, getAdminOrders);
router.patch ("/orders/:id/status",   ...admin, updateAdminOrderStatus);

module.exports = router;
