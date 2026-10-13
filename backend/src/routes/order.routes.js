// backend/src/routes/order.routes.js
const { Router } = require("express");
const { createOrder, getMyOrders, getReceivedOrders, updateOrderStatus } = require("../controllers/order.controller");
const { protect, requireRole } = require("../middlewares/auth.middleware");
const { ROLES } = require("../config/constants");

const router = Router();

router.post  ("/",              protect, createOrder);
router.get   ("/my",            protect, getMyOrders);
router.get   ("/received",      protect, requireRole(ROLES.SELLER, ROLES.ADMIN), getReceivedOrders);
router.patch ("/:id/status",    protect, updateOrderStatus);

module.exports = router;
