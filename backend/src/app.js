// backend/src/app.js
require("dotenv").config();

const path    = require("path");
const express = require("express");
const cors    = require("cors");
const { connectDB } = require("./config/db");
const { errorHandler, notFound } = require("./middlewares/error.middleware");

// Routes
const authRoutes  = require("./routes/auth.routes");
const zebuRoutes  = require("./routes/zebu.routes");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middlewares globaux ──────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods:     ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Fichiers statiques : photos uploadées par les vendeurs ────
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ── Health check ─────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ success: true, message: "Tsena Zebu API opérationnelle", timestamp: new Date() })
);

// ── Routes API ───────────────────────────────────────────────
app.use("/api/auth",   authRoutes);
app.use("/api/zebus",  zebuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin",  adminRoutes);

// ── 404 & Error handler ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Démarrage ────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Tsena Zebu API lancée sur http://localhost:${PORT}`);
    console.log(`📚 Environnement : ${process.env.NODE_ENV || "development"}`);
  });
};

start().catch((err) => {
  console.error("❌ Échec du démarrage :", err);
  process.exit(1);
});
