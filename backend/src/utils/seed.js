// backend/src/utils/seed.js
// Seed minimal : crée uniquement le compte administrateur, pour gérer les
// utilisateurs et la marketplace. Aucun vendeur, aucun acheteur, aucune
// annonce et aucune commande ne sont pré-remplis — la marketplace démarre
// vide. Les vendeurs créent leur propre compte via /register, publient
// leurs annonces (avec leurs vraies photos uploadées) depuis /dashboard,
// et les acheteurs créent leur propre compte pour commander.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB, closeDB } = require("../config/db");
const { COLLECTIONS, ROLES } = require("../config/constants");

const ADMIN_EMAIL    = "admin@tsenazebu.mg";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD manquant dans .env");
  process.exit(1);
}

async function seed() {
  const db = await connectDB();
  console.log("🌱 Seeding la base de données Tsena Zebu…");

  await db.collection(COLLECTIONS.USERS).deleteMany({});
  await db.collection(COLLECTIONS.ZEBUS).deleteMany({});
  await db.collection(COLLECTIONS.ORDERS).deleteMany({});
  console.log("🗑  Collections vidées (utilisateurs, annonces, commandes)");

  console.log("🔐 Hachage du mot de passe admin…");
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const ok = await bcrypt.compare(ADMIN_PASSWORD, adminHash);
  if (!ok) throw new Error("❌ Erreur bcrypt !");
  console.log("   bcrypt OK ✅");

  const now = new Date();

  await db.collection(COLLECTIONS.USERS).insertOne({
    name: "Admin TsenaZebu", email: ADMIN_EMAIL,
    password: adminHash, role: ROLES.ADMIN,
    phone: "+261 34 00 000 00", location: "Antananarivo",
    avatar: null, isBanned: false, deletedAt: null,
    createdAt: now, updatedAt: now,
  });

  console.log(`✅ ${await db.collection(COLLECTIONS.USERS).countDocuments()} utilisateur inséré (admin uniquement)`);
  console.log("ℹ️  Marketplace vide : les vendeurs et acheteurs créent leur propre compte via /register,");
  console.log("   et les vendeurs publient leurs annonces avec leurs propres photos depuis /dashboard.");

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║      IDENTIFIANTS DE CONNEXION         ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║  Admin   : ${ADMIN_EMAIL.padEnd(27)}║`);
  console.log(`║  Password: ${ADMIN_PASSWORD.padEnd(27)}║`);
  console.log("╚════════════════════════════════════════╝");
  console.log("\n🎉 Seed terminé avec succès !\n");

  await closeDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌ Seed échoué :", err.message);
  process.exit(1);
});
