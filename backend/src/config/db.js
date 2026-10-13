// backend/src/config/db.js
// Connexion MongoDB via le driver natif (sans Mongoose)

const { MongoClient } = require("mongodb");

let _db     = null;
let _client = null;

/**
 * Établit la connexion MongoDB et retourne l'instance de la base.
 * Singleton : un seul client pour toute l'application.
 */
const connectDB = async () => {
  if (_db) return _db;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI est absent du fichier .env");
  }

  _client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  await _client.connect();
  _db = _client.db(process.env.DB_NAME || "tsena_zebu");

  // Créer les index (ignoré si déjà existants)
  await _createIndexes(_db);

  console.log(`✅ MongoDB connecté : ${_db.databaseName}`);
  return _db;
};

/** Retourne l'instance DB (doit avoir appelé connectDB() avant). */
const getDB = () => {
  if (!_db) throw new Error("DB non initialisée. Appelez connectDB() d'abord.");
  return _db;
};

/** Ferme proprement la connexion. */
const closeDB = async () => {
  if (_client) {
    await _client.close();
    _db = null;
    _client = null;
  }
};

/**
 * Création des index MongoDB.
 * createIndex est idempotent : si l'index existe déjà, il est ignoré.
 * On wrappe quand même dans try/catch pour ne pas planter au démarrage.
 */
const _createIndexes = async (db) => {
  try {
    // ── users ──
    await db.collection("users").createIndex({ email: 1 },     { unique: true, background: true });
    await db.collection("users").createIndex({ role: 1 },      { background: true });
    await db.collection("users").createIndex({ deletedAt: 1 }, { background: true });

    // ── zebus ──
    await db.collection("zebus").createIndex({ seller: 1 },    { background: true });
    await db.collection("zebus").createIndex({ status: 1 },    { background: true });
    await db.collection("zebus").createIndex({ region: 1 },    { background: true });
    await db.collection("zebus").createIndex({ price: 1 },     { background: true });
    await db.collection("zebus").createIndex({ createdAt: -1 },{ background: true });
    // Index texte pour la recherche (title + description + breed)
    await db.collection("zebus").createIndex(
      { title: "text", description: "text", breed: "text" },
      { background: true, name: "zebu_text_search" }
    );

    // ── orders ──
    await db.collection("orders").createIndex({ buyer: 1 },    { background: true });
    await db.collection("orders").createIndex({ seller: 1 },   { background: true });
    await db.collection("orders").createIndex({ zebu: 1 },     { background: true });
    await db.collection("orders").createIndex({ status: 1 },   { background: true });
    await db.collection("orders").createIndex({ createdAt: -1},{ background: true });

  } catch (err) {
    // Ne pas bloquer le démarrage si un index échoue
    console.warn("⚠️  Avertissement index MongoDB :", err.message);
  }
};

module.exports = { connectDB, getDB, closeDB };
