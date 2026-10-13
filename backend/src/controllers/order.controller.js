// backend/src/controllers/order.controller.js

const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { COLLECTIONS, ORDER_STATUS, ZEBU_STATUS } = require("../config/constants");

/** POST /api/orders — Passer une commande */
const createOrder = async (req, res, next) => {
  try {
    const { zebuId, paymentMethod, notes } = req.body;

    if (!zebuId || !paymentMethod) {
      return res.status(422).json({ success: false, message: "zebuId et méthode de paiement sont obligatoires" });
    }

    const db = getDB();
    const zebu = await db.collection(COLLECTIONS.ZEBUS).findOne({ _id: new ObjectId(zebuId) });

    if (!zebu) return res.status(404).json({ success: false, message: "Annonce introuvable" });
    if (zebu.status !== ZEBU_STATUS.AVAILABLE) {
      return res.status(400).json({ success: false, message: "Ce zébu n'est plus disponible" });
    }
    if (zebu.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Vous ne pouvez pas acheter votre propre annonce" });
    }

    const now = new Date();
    const order = {
      zebu:          zebu._id,
      buyer:         req.user._id,
      seller:        zebu.seller,
      amount:        zebu.price,
      paymentMethod,
      notes:         notes?.trim() || null,
      status:        ORDER_STATUS.PENDING,
      createdAt:     now,
      updatedAt:     now,
    };

    const result = await db.collection(COLLECTIONS.ORDERS).insertOne(order);
    order._id = result.insertedId;

    // Réserver le zébu
    await db.collection(COLLECTIONS.ZEBUS).updateOne(
      { _id: zebu._id },
      { $set: { status: ZEBU_STATUS.RESERVED } }
    );

    res.status(201).json({ success: true, message: "Commande créée avec succès", data: order });
  } catch (err) {
    next(err);
  }
};

/** GET /api/orders/my — Commandes de l'acheteur connecté */
const getMyOrders = async (req, res, next) => {
  try {
    const db = getDB();
    const orders = await db.collection(COLLECTIONS.ORDERS)
      .find({ buyer: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrichir avec les détails du zébu
    const enriched = await _enrichOrders(db, orders);
    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (err) {
    next(err);
  }
};

/** GET /api/orders/received — Commandes reçues par le vendeur connecté */
const getReceivedOrders = async (req, res, next) => {
  try {
    const db = getDB();
    const orders = await db.collection(COLLECTIONS.ORDERS)
      .find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();

    const enriched = await _enrichOrders(db, orders);
    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/orders/:id/status — Mettre à jour le statut (vendeur ou admin) */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!Object.values(ORDER_STATUS).includes(status)) {
      return res.status(422).json({ success: false, message: "Statut invalide" });
    }

    const db = getDB();
    const order = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: new ObjectId(req.params.id) });

    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable" });

    const isSeller = order.seller.toString() === req.user._id.toString();
    const isAdmin  = req.user.role === "superadmin";

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: "Non autorisé" });
    }

    await db.collection(COLLECTIONS.ORDERS).updateOne(
      { _id: order._id },
      { $set: { status, updatedAt: new Date() } }
    );

    // Logique métier sur le zébu
    if (status === ORDER_STATUS.CANCELLED) {
      await db.collection(COLLECTIONS.ZEBUS).updateOne(
        { _id: order.zebu },
        { $set: { status: ZEBU_STATUS.AVAILABLE } }
      );
    }
    if (status === ORDER_STATUS.COMPLETED) {
      await db.collection(COLLECTIONS.ZEBUS).updateOne(
        { _id: order.zebu },
        { $set: { status: ZEBU_STATUS.SOLD } }
      );
    }

    const updated = await db.collection(COLLECTIONS.ORDERS).findOne({ _id: order._id });
    res.json({ success: true, message: "Statut mis à jour", data: updated });
  } catch (err) {
    next(err);
  }
};

/** Enrichit les commandes avec les détails zébu + acheteur + vendeur */
const _enrichOrders = async (db, orders) => {
  if (!orders.length) return [];

  const zebuIds   = [...new Set(orders.map((o) => o.zebu?.toString()).filter(Boolean))];
  const userIds   = [...new Set([
    ...orders.map((o) => o.buyer?.toString()),
    ...orders.map((o) => o.seller?.toString()),
  ].filter(Boolean))];

  const [zebus, users] = await Promise.all([
    db.collection(COLLECTIONS.ZEBUS).find({ _id: { $in: zebuIds.map((id) => new ObjectId(id)) } }).toArray(),
    db.collection(COLLECTIONS.USERS).find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }).project({ password: 0 }).toArray(),
  ]);

  const zebuMap = Object.fromEntries(zebus.map((z) => [z._id.toString(), z]));
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  return orders.map((o) => ({
    ...o,
    zebuDetails:   zebuMap[o.zebu?.toString()] || null,
    buyerDetails:  userMap[o.buyer?.toString()] || null,
    sellerDetails: userMap[o.seller?.toString()] || null,
  }));
};

module.exports = { createOrder, getMyOrders, getReceivedOrders, updateOrderStatus };
