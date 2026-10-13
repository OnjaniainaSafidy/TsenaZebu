// backend/src/utils/check.js
// Vérifier l'état de la base de données
// Lancer avec : node src/utils/check.js

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB, closeDB } = require("../config/db");
const { COLLECTIONS } = require("../config/constants");

async function check() {
  console.log("🔍 Diagnostic TsenaZebu...\n");

  // 1. Connexion MongoDB
  let db;
  try {
    db = await connectDB();
    console.log(`✅ MongoDB connecté : ${db.databaseName}`);
    console.log(`   URI : ${process.env.MONGODB_URI}`);
  } catch (err) {
    console.error("❌ ERREUR CONNEXION MONGODB :", err.message);
    console.error("   → Vérifiez que MongoDB est lancé (sudo systemctl start mongodb)");
    console.error("   → Vérifiez MONGODB_URI dans .env");
    process.exit(1);
  }

  // 2. Compter les documents
  const [userCount, zebuCount, orderCount] = await Promise.all([
    db.collection(COLLECTIONS.USERS).countDocuments(),
    db.collection(COLLECTIONS.ZEBUS).countDocuments(),
    db.collection(COLLECTIONS.ORDERS).countDocuments(),
  ]);
  console.log(`\n📊 État de la base :`);
  console.log(`   👤 Utilisateurs : ${userCount}`);
  console.log(`   🐂 Annonces     : ${zebuCount}`);
  console.log(`   📦 Commandes    : ${orderCount}`);

  if (userCount === 0) {
    console.log("\n⚠️  AUCUN UTILISATEUR ! Lancez : npm run seed");
    await closeDB(); process.exit(0);
  }

  // 3. Lister les utilisateurs
  const users = await db.collection(COLLECTIONS.USERS)
    .find({}).project({ name:1, email:1, role:1, isBanned:1, deletedAt:1 }).toArray();
  console.log(`\n👥 Utilisateurs en base :`);
  users.forEach((u) => {
    const flags = [];
    if (u.isBanned)  flags.push("BANNI");
    if (u.deletedAt) flags.push("SUPPRIMÉ");
    console.log(`   ${u.role.padEnd(10)} | ${u.email.padEnd(30)} | ${u.name} ${flags.join(" ")}`);
  });

  // 4. Test bcrypt du compte admin seed (seul compte pré-rempli)
  const testAccounts = [
    { email: "admin@tsenazebu.mg", password: process.env.ADMIN_PASSWORD },
  ];

  console.log(`\n🔑 Test bcrypt des comptes seed :`);
  for (const acc of testAccounts) {
    const user = await db.collection(COLLECTIONS.USERS).findOne({ email: acc.email });
    if (!user) {
      console.log(`   ❌ ${acc.email} — compte introuvable`);
      continue;
    }
    try {
      const ok = await bcrypt.compare(acc.password, user.password);
      console.log(`   ${ok ? "✅" : "❌"} ${acc.email} — bcrypt compare: ${ok ? "OK" : "ECHEC"}`);
      if (!ok) {
        console.log(`      → Ce compte a été créé avec un salt corrompu.`);
        console.log(`      → Solution : npm run seed (reseed la DB)`);
      }
    } catch (e) {
      console.log(`   ❌ ${acc.email} — ERREUR : ${e.message}`);
    }
  }

  // 5. Vérifier les zébus
  if (zebuCount > 0) {
    const statuses = await db.collection(COLLECTIONS.ZEBUS).aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();
    console.log(`\n🐂 Statuts des annonces :`);
    statuses.forEach((s) => console.log(`   ${s._id.padEnd(12)}: ${s.count}`));
  } else {
    console.log(`\n⚠️  AUCUNE ANNONCE ! Lancez : npm run seed`);
  }

  console.log("\n✅ Diagnostic terminé.\n");
  await closeDB();
  process.exit(0);
}

check().catch((err) => {
  console.error("❌ Erreur diagnostic :", err.message);
  process.exit(1);
});
