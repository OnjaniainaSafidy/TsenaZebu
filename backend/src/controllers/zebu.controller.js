// backend/src/controllers/zebu.controller.js

const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { COLLECTIONS, ZEBU_STATUS } = require("../config/constants");

/** GET /api/zebus — Liste publique avec filtres et pagination */
const getAllZebus = async (req, res, next) => {
  try {
    const db = getDB();
    const {
      page = 1, limit = 12,
      region, breed, sex,
      minPrice, maxPrice,
      status = ZEBU_STATUS.AVAILABLE,
      search, sort = "newest",
    } = req.query;

    const filter = { status };

    if (region)   filter.region = region;
    if (breed)    filter.breed  = breed;
    if (sex)      filter.sex    = sex;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {
      newest:      { createdAt: -1 },
      oldest:      { createdAt:  1 },
      price_asc:   { price:      1 },
      price_desc:  { price:     -1 },
    };
    const sortQuery = sortOptions[sort] || sortOptions.newest;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await db.collection(COLLECTIONS.ZEBUS).countDocuments(filter);

    const zebus = await db.collection(COLLECTIONS.ZEBUS)
      .find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    // Enrichir avec les infos vendeur (lookup manuel, sans Mongoose populate)
    const sellerIds = [...new Set(zebus.map((z) => z.seller?.toString()).filter(Boolean))];
    const sellers = await db.collection(COLLECTIONS.USERS)
      .find({ _id: { $in: sellerIds.map((id) => new ObjectId(id)) } })
      .project({ password: 0 })
      .toArray();
    const sellerMap = Object.fromEntries(sellers.map((s) => [s._id.toString(), s]));

    const enriched = zebus.map((z) => ({
      ...z,
      sellerInfo: sellerMap[z.seller?.toString()] || null,
    }));

    res.json({
      success: true,
      data: enriched,
      pagination: {
        total, page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/zebus/:id */
const getZebuById = async (req, res, next) => {
  try {
    const db = getDB();
    const zebu = await db.collection(COLLECTIONS.ZEBUS).findOne({ _id: new ObjectId(req.params.id) });

    if (!zebu) return res.status(404).json({ success: false, message: "Annonce introuvable" });

    // Incrémenter le compteur de vues
    await db.collection(COLLECTIONS.ZEBUS).updateOne(
      { _id: zebu._id },
      { $inc: { viewCount: 1 } }
    );

    // Infos vendeur
    const seller = await db.collection(COLLECTIONS.USERS).findOne(
      { _id: new ObjectId(zebu.seller) },
      { projection: { password: 0 } }
    );

    res.json({ success: true, data: { ...zebu, sellerInfo: seller } });
  } catch (err) {
    next(err);
  }
};

/** POST /api/zebus — Créer une annonce (vendeurs seulement) */
const createZebu = async (req, res, next) => {
  try {
    const { title, description, price, breed, region, sex, age, weight, images } = req.body;

    if (!title || !price || !breed || !region || !sex) {
      return res.status(422).json({ success: false, message: "Titre, prix, race, région et sexe sont obligatoires" });
    }

    const cleanImages = Array.isArray(images) ? images.map((i) => i?.trim()).filter(Boolean) : [];
    if (cleanImages.length < 2) {
      return res.status(422).json({ success: false, message: "Au moins 2 photos sont obligatoires pour publier une annonce" });
    }

    const db = getDB();
    const now = new Date();

    const newZebu = {
      title:        title.trim(),
      description:  description?.trim() || "",
      price:        Number(price),
      breed,
      region,
      sex,
      age:          age ? Number(age) : null,
      weight:       weight ? Number(weight) : null,
      images:       cleanImages,
      status:       ZEBU_STATUS.AVAILABLE,
      seller:       req.user._id,
      viewCount:    0,
      createdAt:    now,
      updatedAt:    now,
    };

    const result = await db.collection(COLLECTIONS.ZEBUS).insertOne(newZebu);
    newZebu._id = result.insertedId;

    res.status(201).json({ success: true, message: "Annonce créée avec succès", data: newZebu });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/zebus/:id */
const updateZebu = async (req, res, next) => {
  try {
    const db = getDB();
    const zebu = await db.collection(COLLECTIONS.ZEBUS).findOne({ _id: new ObjectId(req.params.id) });

    if (!zebu) return res.status(404).json({ success: false, message: "Annonce introuvable" });

    // Seul le vendeur ou un admin peut modifier
    const isOwner = zebu.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "superadmin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Non autorisé" });
    }

    const { title, description, price, breed, region, sex, age, weight, images, status } = req.body;

    const updates = { updatedAt: new Date() };
    if (title)       updates.title       = title.trim();
    if (description) updates.description = description.trim();
    if (price)       updates.price       = Number(price);
    if (breed)       updates.breed       = breed;
    if (region)      updates.region      = region;
    if (sex)         updates.sex         = sex;
    if (age)         updates.age         = Number(age);
    if (weight)      updates.weight      = Number(weight);
    if (images) {
      const cleanImages = Array.isArray(images) ? images.map((i) => i?.trim()).filter(Boolean) : [];
      if (cleanImages.length < 2) {
        return res.status(422).json({ success: false, message: "Au moins 2 photos sont obligatoires pour cette annonce" });
      }
      updates.images = cleanImages;
    }
    if (status && isAdmin) updates.status = status;

    const updated = await db.collection(COLLECTIONS.ZEBUS).findOneAndUpdate(
      { _id: zebu._id },
      { $set: updates },
      { returnDocument: "after" }
    );

    res.json({ success: true, message: "Annonce mise à jour", data: updated });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/zebus/:id */
const deleteZebu = async (req, res, next) => {
  try {
    const db = getDB();
    const zebu = await db.collection(COLLECTIONS.ZEBUS).findOne({ _id: new ObjectId(req.params.id) });

    if (!zebu) return res.status(404).json({ success: false, message: "Annonce introuvable" });

    const isOwner = zebu.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "superadmin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Non autorisé" });
    }

    await db.collection(COLLECTIONS.ZEBUS).deleteOne({ _id: zebu._id });

    res.json({ success: true, message: "Annonce supprimée" });
  } catch (err) {
    next(err);
  }
};

/** GET /api/zebus/my — Annonces du vendeur connecté */
const getMyZebus = async (req, res, next) => {
  try {
    const db = getDB();
    const zebus = await db.collection(COLLECTIONS.ZEBUS)
      .find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, data: zebus, total: zebus.length });
  } catch (err) {
    next(err);
  }
};

/** GET /api/zebus/stats — Stats pour le vendeur connecté */
const getMyStats = async (req, res, next) => {
  try {
    const db = getDB();
    const sellerId = req.user._id;

    const [totalListings, availableListings, soldListings, totalOrders, totalRevenue] = await Promise.all([
      db.collection(COLLECTIONS.ZEBUS).countDocuments({ seller: sellerId }),
      db.collection(COLLECTIONS.ZEBUS).countDocuments({ seller: sellerId, status: ZEBU_STATUS.AVAILABLE }),
      db.collection(COLLECTIONS.ZEBUS).countDocuments({ seller: sellerId, status: ZEBU_STATUS.SOLD }),
      db.collection(COLLECTIONS.ORDERS).countDocuments({ seller: sellerId }),
      db.collection(COLLECTIONS.ORDERS).aggregate([
        { $match: { seller: sellerId, status: { $in: ["confirmed", "completed"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),
    ]);

    res.json({
      success: true,
      data: {
        totalListings,
        availableListings,
        soldListings,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/zebus/upload-images — Upload réel de photos (vendeur/admin) */
const uploadImages = async (req, res, next) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(422).json({ success: false, message: "Aucune image reçue" });
    }
    const urls = files.map((f) => `/uploads/zebus/${req.user._id.toString()}/${f.filename}`);
    res.status(201).json({ success: true, message: "Photos envoyées avec succès", urls });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllZebus, getZebuById, createZebu, updateZebu, deleteZebu, getMyZebus, getMyStats, uploadImages };
