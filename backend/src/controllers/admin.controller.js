// backend/src/controllers/admin.controller.js

const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { COLLECTIONS, ZEBU_STATUS, ORDER_STATUS, ROLES } = require("../config/constants");

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

/** GET /api/admin/dashboard */
const getDashboard = async (req, res, next) => {
  try {
    const db = getDB();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, totalZebus, totalOrders,
      newUsersThisMonth, newZebusThisMonth,
      pendingListings, bannedUsers, deletedUsers,
      pendingOrders, confirmedOrders,
      revenueAgg,
    ] = await Promise.all([
      db.collection(COLLECTIONS.USERS).countDocuments({ deletedAt: null }),
      db.collection(COLLECTIONS.ZEBUS).countDocuments(),
      db.collection(COLLECTIONS.ORDERS).countDocuments(),
      db.collection(COLLECTIONS.USERS).countDocuments({ createdAt: { $gte: startOfMonth }, deletedAt: null }),
      db.collection(COLLECTIONS.ZEBUS).countDocuments({ createdAt: { $gte: startOfMonth } }),
      db.collection(COLLECTIONS.ZEBUS).countDocuments({ status: ZEBU_STATUS.PENDING }),
      db.collection(COLLECTIONS.USERS).countDocuments({ isBanned: true, deletedAt: null }),
      db.collection(COLLECTIONS.USERS).countDocuments({ deletedAt: { $ne: null } }),
      db.collection(COLLECTIONS.ORDERS).countDocuments({ status: ORDER_STATUS.PENDING }),
      db.collection(COLLECTIONS.ORDERS).countDocuments({ status: ORDER_STATUS.CONFIRMED }),
      db.collection(COLLECTIONS.ORDERS).aggregate([
        { $match: { status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.COMPLETED] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalZebus, totalOrders,
        totalRevenue: revenueAgg[0]?.total || 0,
        newUsersThisMonth, newZebusThisMonth,
        pendingListings, bannedUsers, deletedUsers,
        pendingOrders, confirmedOrders,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GESTION DES UTILISATEURS ACTIFS
// ─────────────────────────────────────────────────────────────

/** GET /api/admin/users?search=&page=&limit= */
const getUsers = async (req, res, next) => {
  try {
    const db   = getDB();
    const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip  = (page - 1) * limit;

    // Exclure le compte admin connecté de sa propre liste
    const filter = { deletedAt: null, _id: { $ne: req.user._id } };
    if (req.query.search) {
      const rx = new RegExp(req.query.search, "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }
    if (req.query.role) filter.role = req.query.role;

    const [users, total] = await Promise.all([
      db.collection(COLLECTIONS.USERS)
        .find(filter)
        .project({ password: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection(COLLECTIONS.USERS).countDocuments(filter),
    ]);

    res.json({ success: true, data: users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/admin/users/:id/ban */
const banUser = async (req, res, next) => {
  try {
    const { isBanned } = req.body;
    const db = getDB();

    const user = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
      { _id: new ObjectId(req.params.id), deletedAt: null },
      { $set: { isBanned: Boolean(isBanned), updatedAt: new Date() } },
      { returnDocument: "after", projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });

    res.json({ success: true, message: isBanned ? "Utilisateur banni" : "Utilisateur débanni", data: user });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/admin/users/:id/role */
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      return res.status(422).json({ success: false, message: "Rôle invalide" });
    }

    const db = getDB();
    const user = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
      { _id: new ObjectId(req.params.id), deletedAt: null },
      { $set: { role, updatedAt: new Date() } },
      { returnDocument: "after", projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable" });

    res.json({ success: true, message: "Rôle mis à jour", data: user });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// MODIFICATION NOM UTILISATEUR
// ─────────────────────────────────────────────────────────────

/** PATCH /api/admin/users/:id/name — Modifier le nom d'un utilisateur */
const updateUserName = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(422).json({ success: false, message: "Le nom ne peut pas être vide" });
    }
    if (name.trim().length < 2) {
      return res.status(422).json({ success: false, message: "Le nom doit contenir au moins 2 caractères" });
    }

    const db   = getDB();
    const user = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
      { _id: new ObjectId(req.params.id), deletedAt: null },
      { $set: { name: name.trim(), updatedAt: new Date() } },
      { returnDocument: "after", projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    }

    res.json({ success: true, message: "Nom mis à jour avec succès", data: user });
  } catch (err) {
    next(err);
  }
};

// SUPPRESSION DOUCE ET RESTAURATION
// ─────────────────────────────────────────────────────────────

/** DELETE /api/admin/users/:id — Soft delete */
const softDeleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Vous ne pouvez pas supprimer votre propre compte" });
    }

    const db = getDB();
    const user = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
      { _id: new ObjectId(req.params.id), deletedAt: null },
      { $set: { deletedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after", projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable ou déjà supprimé" });

    res.json({ success: true, message: "Utilisateur supprimé (restaurable)", data: user });
  } catch (err) {
    next(err);
  }
};

/** GET /api/admin/users/deleted?search= — Comptes supprimés */
const getDeletedUsers = async (req, res, next) => {
  try {
    const db   = getDB();
    const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip  = (page - 1) * limit;

    const filter = { deletedAt: { $ne: null } };
    if (req.query.search) {
      const rx = new RegExp(req.query.search, "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }

    const [users, total] = await Promise.all([
      db.collection(COLLECTIONS.USERS)
        .find(filter)
        .project({ password: 0 })
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection(COLLECTIONS.USERS).countDocuments(filter),
    ]);

    res.json({ success: true, data: users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

/** POST /api/admin/users/:id/restore — Restaurer un compte supprimé */
const restoreUser = async (req, res, next) => {
  try {
    const db = getDB();
    const user = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
      { _id: new ObjectId(req.params.id), deletedAt: { $ne: null } },
      { $set: { deletedAt: null, isBanned: false, updatedAt: new Date() } },
      { returnDocument: "after", projection: { password: 0 } }
    );

    if (!user) return res.status(404).json({ success: false, message: "Utilisateur introuvable ou déjà actif" });

    res.json({ success: true, message: "Compte restauré avec succès", data: user });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GESTION DES ANNONCES
// ─────────────────────────────────────────────────────────────

/** GET /api/admin/zebus?status=&page= */
const getAdminZebus = async (req, res, next) => {
  try {
    const db   = getDB();
    const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [zebus, total] = await Promise.all([
      db.collection(COLLECTIONS.ZEBUS)
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection(COLLECTIONS.ZEBUS).countDocuments(filter),
    ]);

    // Enrichir avec infos vendeur
    const sellerIds = [...new Set(zebus.map((z) => z.seller?.toString()).filter(Boolean))];
    const sellers = await db.collection(COLLECTIONS.USERS)
      .find({ _id: { $in: sellerIds.map((id) => new ObjectId(id)) } })
      .project({ name: 1, email: 1 })
      .toArray();
    const sellerMap = Object.fromEntries(sellers.map((s) => [s._id.toString(), s]));

    const enriched = zebus.map((z) => ({ ...z, sellerInfo: sellerMap[z.seller?.toString()] || null }));

    res.json({ success: true, data: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/admin/zebus/:id/status */
const updateZebuStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!Object.values(ZEBU_STATUS).includes(status)) {
      return res.status(422).json({ success: false, message: "Statut invalide" });
    }

    const db = getDB();
    const zebu = await db.collection(COLLECTIONS.ZEBUS).findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!zebu) return res.status(404).json({ success: false, message: "Annonce introuvable" });

    res.json({ success: true, message: "Statut mis à jour", data: zebu });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GESTION DES COMMANDES (ADMIN)
// ─────────────────────────────────────────────────────────────

/** GET /api/admin/orders?status=&page= */
const getAdminOrders = async (req, res, next) => {
  try {
    const db   = getDB();
    const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
    const limit = Math.min(50, parseInt(req.query.limit || "20", 10));
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      db.collection(COLLECTIONS.ORDERS)
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection(COLLECTIONS.ORDERS).countDocuments(filter),
    ]);

    // Enrichir avec zébu + acheteur + vendeur
    const zebuIds = [...new Set(orders.map((o) => o.zebu?.toString()).filter(Boolean))];
    const userIds = [...new Set([
      ...orders.map((o) => o.buyer?.toString()),
      ...orders.map((o) => o.seller?.toString()),
    ].filter(Boolean))];

    const [zebus, users] = await Promise.all([
      db.collection(COLLECTIONS.ZEBUS).find({ _id: { $in: zebuIds.map((id) => new ObjectId(id)) } }).toArray(),
      db.collection(COLLECTIONS.USERS).find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }).project({ password: 0 }).toArray(),
    ]);

    const zebuMap = Object.fromEntries(zebus.map((z) => [z._id.toString(), z]));
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    const enriched = orders.map((o) => ({
      ...o,
      zebuDetails:   zebuMap[o.zebu?.toString()] || null,
      buyerDetails:  userMap[o.buyer?.toString()] || null,
      sellerDetails: userMap[o.seller?.toString()] || null,
    }));

    res.json({ success: true, data: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/admin/orders/:id/status */
const updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(422).json({ success: false, message: "Statut invalide" });
    }

    const db = getDB();
    const order = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: new ObjectId(req.params.id) });
    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable" });

    await db.collection(COLLECTIONS.ORDERS).updateOne(
      { _id: order._id },
      { $set: { status, updatedAt: new Date() } }
    );

    if (status === ORDER_STATUS.CANCELLED) {
      await db.collection(COLLECTIONS.ZEBUS).updateOne({ _id: order.zebu }, { $set: { status: ZEBU_STATUS.AVAILABLE } });
    }
    if (status === ORDER_STATUS.COMPLETED) {
      await db.collection(COLLECTIONS.ZEBUS).updateOne({ _id: order.zebu }, { $set: { status: ZEBU_STATUS.SOLD } });
    }

    const updated = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: order._id });
    res.json({ success: true, message: "Statut commande mis à jour", data: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getUsers, banUser, changeUserRole, updateUserName,
  softDeleteUser, getDeletedUsers, restoreUser,
  getAdminZebus, updateZebuStatus,
  getAdminOrders, updateAdminOrderStatus,
};
