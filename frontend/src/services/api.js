// frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Injecter le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tz_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gérer l'expiration du token
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("tz_token");
      localStorage.removeItem("tz_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register:       (data)   => api.post("/auth/register", data),
  login:          (data)   => api.post("/auth/login", data),
  getMe:          ()       => api.get("/auth/me"),
  updateMe:       (data)   => api.put("/auth/me", data),
  changePassword: (data)   => api.put("/auth/change-password", data),
};

// ── Zébus ─────────────────────────────────────────────────────
export const zebuAPI = {
  getAll:   (params) => api.get("/zebus", { params }),
  getById:  (id)     => api.get(`/zebus/${id}`),
  getMy:    ()       => api.get("/zebus/my"),
  getStats: ()       => api.get("/zebus/my/stats"),
  create:   (data)   => api.post("/zebus", data),
  update:   (id, d)  => api.put(`/zebus/${id}`, d),
  delete:   (id)     => api.delete(`/zebus/${id}`),
  // Upload réel de fichiers photo (multipart/form-data)
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return api.post("/zebus/upload-images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ── Commandes ─────────────────────────────────────────────────
export const orderAPI = {
  create:         (data) => api.post("/orders", data),
  getMy:          ()     => api.get("/orders/my"),
  getReceived:    ()     => api.get("/orders/received"),
  updateStatus:   (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:       ()           => api.get("/admin/dashboard"),
  // Utilisateurs
  getUsers:           (params)     => api.get("/admin/users", { params }),
  banUser:            (id, val)    => api.patch(`/admin/users/${id}/ban`, { isBanned: val }),
  changeRole:         (id, role)   => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser:         (id)         => api.delete(`/admin/users/${id}`),
  // Supprimés
  getDeletedUsers:    (params)     => api.get("/admin/users/deleted", { params }),
  restoreUser:        (id)         => api.post(`/admin/users/${id}/restore`),
  // Annonces
  getZebus:           (params)     => api.get("/admin/zebus", { params }),
  updateZebuStatus:   (id, status) => api.patch(`/admin/zebus/${id}/status`, { status }),
  // Commandes
  getOrders:          (params)     => api.get("/admin/orders", { params }),
  updateUserName:     (id, name)   => api.patch(`/admin/users/${id}/name`, { name }),
  updateOrderStatus:  (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
};

export default api;
