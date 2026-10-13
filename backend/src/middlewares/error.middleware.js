// backend/src/middlewares/error.middleware.js

/**
 * Middleware de gestion centralisée des erreurs.
 * Doit être enregistré en dernier dans app.js (après toutes les routes).
 */
const errorHandler = (err, req, res, _next) => {
  const isDev = process.env.NODE_ENV === "development";

  // Log de l'erreur côté serveur
  console.error(`[ERROR] ${req.method} ${req.originalUrl} —`, err.message);
  if (isDev) console.error(err.stack);

  // Erreur MongoDB : clé dupliquée (ex: email unique)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "champ";
    return res.status(409).json({
      success: false,
      message: `${field} déjà utilisé. Veuillez en choisir un autre.`,
    });
  }

  // Erreur ObjectId invalide
  if (err.name === "BSONError" || err.message?.includes("ObjectId")) {
    return res.status(400).json({ success: false, message: "Identifiant invalide" });
  }

  // Erreur de validation personnalisée
  if (err.isValidation) {
    return res.status(422).json({ success: false, message: err.message });
  }

  // Erreur générique
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Erreur interne du serveur",
    ...(isDev && { stack: err.stack }),
  });
};

/**
 * Middleware 404 — route non trouvée.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
