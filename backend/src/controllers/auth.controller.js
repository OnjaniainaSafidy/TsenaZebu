// backend/src/controllers/auth.controller.js

const bcrypt = require("bcryptjs");
const { getDB } = require("../config/db");
const { COLLECTIONS, ROLES } = require("../config/constants");
const { generateToken } = require("../middlewares/auth.middleware");

/** POST /api/auth/register */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    if (!name || !email || !password) {
      return res.status(422).json({ success: false, message: "Nom, email et mot de passe sont obligatoires" });
    }
    if (password.length < 6) {
      return res.status(422).json({ success: false, message: "Le mot de passe doit contenir au moins 6 caractères" });
    }
    if (!email.includes("@")) {
      return res.status(422).json({ success: false, message: "Email invalide" });
    }

    const db = getDB();

    // Vérifier unicité de l'email
    const existing = await db.collection(COLLECTIONS.USERS).findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Cet email est déjà utilisé" });
    }

    const allowedRoles = [ROLES.BUYER, ROLES.SELLER];
    const userRole = allowedRoles.includes(role) ? role : ROLES.BUYER;

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const now = new Date();
    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: userRole,
      phone: phone?.trim() || null,
      location: location?.trim() || null,
      avatar: null,
      isBanned: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(COLLECTIONS.USERS).insertOne(newUser);
    const token = generateToken(result.insertedId);

    const { password: _, ...userWithoutPassword } = newUser;
    userWithoutPassword._id = result.insertedId;

    res.status(201).json({
      success: true,
      message: "Compte créé avec succès",
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ success: false, message: "Email et mot de passe sont obligatoires" });
    }

    const db = getDB();
    const user = await db.collection(COLLECTIONS.USERS).findOne({
      email: email.toLowerCase().trim(),
      deletedAt: null,
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: "Compte suspendu. Contactez l'administrateur." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });
    }

    const token = generateToken(user._id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Connexion réussie",
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/auth/me */
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

/** PUT /api/auth/me — mise à jour du profil */
const updateMe = async (req, res, next) => {
  try {
    const { name, phone, location } = req.body;
    const db = getDB();
    const now = new Date();

    const updates = { updatedAt: now };
    if (name)     updates.name     = name.trim();
    if (phone)    updates.phone    = phone.trim();
    if (location) updates.location = location.trim();

    const result = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
      { _id: req.user._id },
      { $set: updates },
      { returnDocument: "after", projection: { password: 0 } }
    );

    res.json({ success: true, user: result });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/auth/change-password */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(422).json({ success: false, message: "Les deux mots de passe sont requis" });
    }
    if (newPassword.length < 6) {
      return res.status(422).json({ success: false, message: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
    }

    const db = getDB();
    const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: req.user._id });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Mot de passe actuel incorrect" });
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(newPassword, salt);

    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: req.user._id },
      { $set: { password: hashed, updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Mot de passe modifié avec succès" });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateMe, changePassword };
