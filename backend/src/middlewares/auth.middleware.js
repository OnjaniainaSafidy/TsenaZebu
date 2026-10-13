// backend/src/middlewares/auth.middleware.js

const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { COLLECTIONS } = require("../config/constants");

/**
 * Middleware protect — vérifie le token JWT dans le header Authorization.
 * Attache req.user à la requête si valide.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Non autorisé : token manquant" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = getDB();
    const user = await db.collection(COLLECTIONS.USERS).findOne(
      { _id: new ObjectId(decoded.id), deletedAt: null },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(401).json({ success: false, message: "Utilisateur introuvable ou supprimé" });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: "Compte suspendu. Contactez l'administrateur." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Token invalide" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expiré, veuillez vous reconnecter" });
    }
    next(err);
  }
};

/**
 * Middleware requireRole — restreint l'accès à certains rôles.
 * Doit être utilisé après protect.
 * @param {...string} roles - Rôles autorisés
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Non authentifié" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis : ${roles.join(" ou ")}`,
      });
    }
    next();
  };
};

/**
 * Génère un JWT signé pour l'utilisateur donné.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = { protect, requireRole, generateToken };
