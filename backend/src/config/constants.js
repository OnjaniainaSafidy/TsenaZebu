// backend/src/config/constants.js

const COLLECTIONS = {
  USERS: "users",
  ZEBUS: "zebus",
  ORDERS: "orders",
  FAVORITES: "favorites",
};

const ROLES = {
  BUYER: "buyer",
  SELLER: "seller",
  ADMIN: "superadmin",
};

const ZEBU_STATUS = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  SOLD: "sold",
  PENDING: "pending",
};

const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const ZEBU_BREEDS = [
  "Zébu Malgache",
  "Zébu Gris",
  "Brahman",
  "Sanga",
  "Rana",
  "Créole Malgache",
];

const REGIONS_MADAGASCAR = [
  "Analamanga", "Vakinankaratra", "Itasy", "Bongolava",
  "Haute Matsiatra", "Amoron'i Mania", "Vatovavy",
  "Fitovinany", "Atsinanana", "Analanjirofo",
  "Alaotra-Mangoro", "Boeny", "Sofia", "Betsiboka",
  "Melaky", "Atsimo-Atsinanana", "Atsimo-Andrefana",
  "Androy", "Anosy", "Menabe", "Diana", "Sava",
];

const PAYMENT_METHODS = ["mobile_money", "virement", "especes", "cheque"];

module.exports = {
  COLLECTIONS,
  ROLES,
  ZEBU_STATUS,
  ORDER_STATUS,
  ZEBU_BREEDS,
  REGIONS_MADAGASCAR,
  PAYMENT_METHODS,
};
