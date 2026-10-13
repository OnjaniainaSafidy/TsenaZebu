// frontend/src/pages/Admin.jsx
import { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../services/api";
import Spinner from "../components/ui/Spinner";
import {
  Users, Package, ShoppingCart, DollarSign,
  Search, Trash2, RotateCcw, UserX,
  Ban, CheckCircle, Shield, BarChart2,
  Pencil, X, Check,
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-MG").format(n);

const ORDER_LBL = { pending:"En attente", confirmed:"Confirmée", completed:"Complétée", cancelled:"Annulée" };
const ORDER_CLS = { pending:"badge-yellow", confirmed:"badge-blue", completed:"badge-green", cancelled:"badge-red" };
const ZEBU_LBL  = { available:"Disponible", reserved:"Réservé", sold:"Vendu", pending:"En attente" };
const ZEBU_CLS  = { available:"badge-green", reserved:"badge-yellow", sold:"badge-gray", pending:"badge-blue" };

// ── Composants utilitaires ─────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  </div>
);

const AlertBanner = ({ icon, title, desc, color }) => (
  <div className={`border rounded-xl p-4 flex items-center gap-3 ${color}`}>
    {icon}
    <div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  </div>
);

// ── Composant inline pour éditer le nom ───────────────────────────────────

const EditNameCell = ({ user, onSave, onCancel, saving }) => {
  const [val, setVal] = useState(user.name);
  return (
    <div className="flex items-center gap-1.5 min-w-[200px]">
      <input
        autoFocus
        className="border border-primary rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-primary"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(val);
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        onClick={() => onSave(val)}
        disabled={saving || !val.trim()}
        className="p-1 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40"
        title="Valider"
      >
        <Check size={14} />
      </button>
      <button
        onClick={onCancel}
        className="p-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200"
        title="Annuler"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ── Page Admin ────────────────────────────────────────────────────────────

export default function Admin() {
  const [tab, setTab] = useState("dashboard");

  // Dashboard
  const [stats, setStats] = useState(null);

  // Utilisateurs
  const [users,      setUsers]      = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoad,  setUsersLoad]  = useState(false);

  // Édition de nom — { userId, saving }
  const [editingName, setEditingName] = useState(null);

  // Supprimés
  const [deleted,     setDeleted]     = useState([]);
  const [delSearch,   setDelSearch]   = useState("");
  const [deletedLoad, setDeletedLoad] = useState(false);

  // Commandes
  const [orders,      setOrders]      = useState([]);
  const [orderFilter, setOrderFilter] = useState("");
  const [ordersLoad,  setOrdersLoad]  = useState(false);

  // Annonces
  const [zebus,       setZebus]       = useState([]);
  const [zebuFilter,  setZebuFilter]  = useState("");
  const [zebusLoad,   setZebusLoad]   = useState(false);

  // ── Loaders ─────────────────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    try { const r = await adminAPI.getDashboard(); setStats(r.data.data); }
    catch (e) { console.error(e); }
  }, []);

  const loadUsers = useCallback(async (search = userSearch) => {
    setUsersLoad(true);
    try { const r = await adminAPI.getUsers({ search: search || undefined }); setUsers(r.data.data); }
    catch (e) { console.error(e); } finally { setUsersLoad(false); }
  }, [userSearch]);

  const loadDeleted = useCallback(async (search = delSearch) => {
    setDeletedLoad(true);
    try { const r = await adminAPI.getDeletedUsers({ search: search || undefined }); setDeleted(r.data.data); }
    catch (e) { console.error(e); } finally { setDeletedLoad(false); }
  }, [delSearch]);

  const loadOrders = useCallback(async (status = orderFilter) => {
    setOrdersLoad(true);
    try { const r = await adminAPI.getOrders({ status: status || undefined }); setOrders(r.data.data); }
    catch (e) { console.error(e); } finally { setOrdersLoad(false); }
  }, [orderFilter]);

  const loadZebus = useCallback(async (status = zebuFilter) => {
    setZebusLoad(true);
    try { const r = await adminAPI.getZebus({ status: status || undefined }); setZebus(r.data.data); }
    catch (e) { console.error(e); } finally { setZebusLoad(false); }
  }, [zebuFilter]);

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { if (tab === "users")    loadUsers();   }, [tab]);
  useEffect(() => { if (tab === "deleted")  loadDeleted(); }, [tab]);
  useEffect(() => { if (tab === "orders")   loadOrders();  }, [tab]);
  useEffect(() => { if (tab === "listings") loadZebus();   }, [tab]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const banUser = async (id, isBanned) => {
    try { await adminAPI.banUser(id, !isBanned); await loadUsers(); await loadDashboard(); }
    catch (e) { alert(e.response?.data?.message || "Erreur"); }
  };

  const changeRole = async (id, role) => {
    try { await adminAPI.changeRole(id, role); await loadUsers(); }
    catch (e) { alert(e.response?.data?.message || "Erreur"); }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Supprimer "${name}" ? (Récupérable depuis l'onglet Supprimés)`)) return;
    try { await adminAPI.deleteUser(id); await loadUsers(); await loadDeleted(); await loadDashboard(); }
    catch (e) { alert(e.response?.data?.message || "Erreur"); }
  };

  const restoreUser = async (id, name) => {
    try { await adminAPI.restoreUser(id); await loadDeleted(); await loadDashboard(); alert(`✅ "${name}" restauré`); }
    catch (e) { alert(e.response?.data?.message || "Erreur"); }
  };

  // ── Modification du nom d'utilisateur ──────────────────────────────────

  const startEditName = (userId) => {
    setEditingName({ userId, saving: false });
  };

  const cancelEditName = () => setEditingName(null);

  const saveUserName = async (userId, newName) => {
    if (!newName.trim() || newName.trim().length < 2) {
      alert("Le nom doit contenir au moins 2 caractères"); return;
    }
    setEditingName((e) => ({ ...e, saving: true }));
    try {
      await adminAPI.updateUserName(userId, newName.trim());
      await loadUsers();
      setEditingName(null);
    } catch (e) {
      alert(e.response?.data?.message || "Erreur lors de la modification");
      setEditingName((e) => ({ ...e, saving: false }));
    }
  };

  const updateZebuStatus = async (id, status) => {
    try { await adminAPI.updateZebuStatus(id, status); await loadZebus(); }
    catch (e) { alert(e.response?.data?.message || "Erreur"); }
  };

  const updateOrderStatus = async (id, status) => {
    try { await adminAPI.updateOrderStatus(id, status); await loadOrders(); await loadDashboard(); }
    catch (e) { alert(e.response?.data?.message || "Erreur"); }
  };

  // ── Onglets ───────────────────────────────────────────────────────────────

  const tabs = [
    { id:"dashboard", label:"Vue d'ensemble",  badge: null },
    { id:"users",     label:"Utilisateurs",    badge: null },
    { id:"deleted",   label:"Supprimés",       badge: stats?.deletedUsers > 0 ? stats.deletedUsers : null },
    { id:"orders",    label:"Commandes",       badge: stats?.pendingOrders > 0 ? stats.pendingOrders : null },
    { id:"listings",  label:"Annonces",        badge: stats?.pendingListings > 0 ? stats.pendingListings : null },
  ];

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* En-tête */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-800">Administration</h1>
          <p className="text-gray-500 text-sm">Supervision complète de la marketplace TsenaZebu</p>
        </div>
      </div>

      {/* Navigation onglets */}
      <div className="flex gap-1 border-b border-gray-200 mb-7 overflow-x-auto">
        {tabs.map(({ id, label, badge }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors
              ${tab === id ? "tab-active" : "tab-inactive"}`}>
            {label}
            {badge && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.1rem] text-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          VUE D'ENSEMBLE
      ══════════════════════════════════════════════════════ */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          {!stats ? <Spinner /> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Users size={22}/>}        label="Utilisateurs actifs" value={stats.totalUsers}   sub={`+${stats.newUsersThisMonth} ce mois`} />
                <StatCard icon={<Package size={22}/>}      label="Annonces publiées"   value={stats.totalZebus}   sub={`+${stats.newZebusThisMonth} ce mois`} />
                <StatCard icon={<ShoppingCart size={22}/>} label="Total commandes"     value={stats.totalOrders}  sub={`${stats.pendingOrders} en attente`} />
                <StatCard icon={<DollarSign size={22}/>}   label="Volume d'affaires"   value={`Ar ${fmt(stats.totalRevenue)}`} sub="confirmées + complétées" />
              </div>

              {(stats.deletedUsers > 0 || stats.bannedUsers > 0 || stats.pendingListings > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {stats.deletedUsers   > 0 && <AlertBanner color="border-red-200 bg-red-50"      icon={<UserX size={20} className="text-red-500 flex-shrink-0"/>}   title={`${stats.deletedUsers} compte(s) supprimé(s)`}      desc="Restaurables depuis l'onglet Supprimés" />}
                  {stats.bannedUsers    > 0 && <AlertBanner color="border-orange-200 bg-orange-50" icon={<Ban size={20} className="text-orange-500 flex-shrink-0"/>}   title={`${stats.bannedUsers} utilisateur(s) banni(s)`}      desc="Gérer depuis l'onglet Utilisateurs" />}
                  {stats.pendingListings> 0 && <AlertBanner color="border-yellow-200 bg-yellow-50" icon={<Package size={20} className="text-yellow-600 flex-shrink-0"/>}title={`${stats.pendingListings} annonce(s) en attente`}   desc="À valider dans l'onglet Annonces" />}
                </div>
              )}

              <div className="card p-5">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><BarChart2 size={18}/> Répartition des commandes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label:"En attente",  val: stats.pendingOrders,   cls:"text-yellow-600 bg-yellow-50" },
                    { label:"Confirmées",  val: stats.confirmedOrders, cls:"text-blue-600 bg-blue-50" },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl p-4 text-center ${s.cls}`}>
                      <p className="text-2xl font-bold">{s.val}</p>
                      <p className="text-xs mt-1 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          UTILISATEURS ACTIFS
      ══════════════════════════════════════════════════════ */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
              <input className="input pl-9 text-sm" placeholder="Rechercher par nom ou email…"
                value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUsers(userSearch)} />
            </div>
            <button onClick={() => loadUsers(userSearch)} className="btn-primary text-sm py-2 px-4">Rechercher</button>
          </div>

          {/* Légende modification de nom */}
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Pencil size={11}/> Cliquez sur l'icône crayon pour modifier le nom d'un utilisateur.
          </p>

          {usersLoad ? <Spinner /> : users.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Users size={40} className="mx-auto mb-3 opacity-30"/>
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Utilisateur</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Rôle</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Inscription</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => {
                    const isEditing = editingName?.userId === u._id;
                    return (
                      <tr key={u._id} className="hover:bg-gray-50 transition-colors">

                        {/* Nom — mode normal ou mode édition */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div>
                              <EditNameCell
                                user={u}
                                saving={editingName.saving}
                                onSave={(newName) => saveUserName(u._id, newName)}
                                onCancel={cancelEditName}
                              />
                              <p className="text-xs text-gray-400 mt-1">{u.email}</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium">{u.name}</p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                              </div>
                              <button
                                onClick={() => startEditName(u._id)}
                                className="p-1 rounded hover:bg-amber-100 text-gray-300 hover:text-primary transition-colors flex-shrink-0"
                                title="Modifier le nom"
                              >
                                <Pencil size={13}/>
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <select className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                            value={u.role} onChange={(e) => changeRole(u._id, e.target.value)}>
                            <option value="buyer">Acheteur</option>
                            <option value="seller">Vendeur</option>
                            <option value="superadmin">Admin</option>
                          </select>
                        </td>

                        <td className="px-4 py-3">
                          <span className={u.isBanned ? "badge-red" : "badge-green"}>
                            {u.isBanned ? "Banni" : "Actif"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString("fr-MG")}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => banUser(u._id, u.isBanned)}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors
                                ${u.isBanned
                                  ? "border-green-300 text-green-700 hover:bg-green-50"
                                  : "border-orange-300 text-orange-700 hover:bg-orange-50"}`}>
                              {u.isBanned ? "Débannir" : "Bannir"}
                            </button>
                            <button onClick={() => deleteUser(u._id, u.name)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Supprimer (récupérable)">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          COMPTES SUPPRIMÉS
      ══════════════════════════════════════════════════════ */}
      {tab === "deleted" && (
        <div className="space-y-4">
          <div className="card p-4 bg-red-50 border-red-100">
            <p className="text-sm text-red-700 font-medium flex items-center gap-2">
              <UserX size={16}/> Les comptes supprimés sont conservés en base de données.
            </p>
            <p className="text-xs text-red-500 mt-1">
              Recherchez un compte supprimé par nom ou email, puis restaurez-le en un clic.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
              <input className="input pl-9 text-sm" placeholder="Nom ou email du compte supprimé…"
                value={delSearch} onChange={(e) => setDelSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadDeleted(delSearch)} />
            </div>
            <button onClick={() => loadDeleted(delSearch)} className="btn-primary text-sm py-2 px-4">Rechercher</button>
          </div>

          {deletedLoad ? <Spinner /> : deleted.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <UserX size={48} className="mx-auto mb-3 opacity-20"/>
              <p className="font-medium">Aucun compte supprimé</p>
              {delSearch && <p className="text-sm mt-1">Aucun résultat pour "{delSearch}"</p>}
              {!delSearch && <p className="text-sm mt-1">Tous les comptes sont actifs ✅</p>}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-xs text-red-600 font-medium">
                {deleted.length} compte(s) supprimé(s) trouvé(s)
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Utilisateur</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Rôle</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Supprimé le</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Restaurer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deleted.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 opacity-80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-400 line-through">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3"><span className="badge-gray">{u.role}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(u.deletedAt).toLocaleDateString("fr-MG", { day:"2-digit", month:"long", year:"numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => restoreUser(u._id, u.name)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-400 text-green-700 hover:bg-green-50 transition-colors ml-auto font-medium">
                          <RotateCcw size={13}/> Restaurer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          COMMANDES
      ══════════════════════════════════════════════════════ */}
      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <span className="text-sm font-medium text-gray-600">Filtrer :</span>
            <select className="input w-48 text-sm py-1.5" value={orderFilter}
              onChange={(e) => { setOrderFilter(e.target.value); loadOrders(e.target.value); }}>
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="completed">Complétées</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>

          {ordersLoad ? <Spinner /> : orders.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-20"/>
              <p className="font-medium">Aucune commande{orderFilter ? ` "${ORDER_LBL[orderFilter]}"` : ""}</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Annonce</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Acheteur</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Vendeur</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Montant</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Changer statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="truncate font-medium">{o.zebuDetails?.title || <em className="text-gray-400">Supprimée</em>}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{o.buyerDetails?.name}</p>
                          <p className="text-xs text-gray-400">{o.buyerDetails?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{o.sellerDetails?.name}</p>
                          <p className="text-xs text-gray-400">{o.sellerDetails?.email}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-primary">Ar {fmt(o.amount)}</td>
                        <td className="px-4 py-3"><span className={ORDER_CLS[o.status]}>{ORDER_LBL[o.status]}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(o.createdAt).toLocaleDateString("fr-MG", { day:"2-digit", month:"short", year:"numeric" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                            value={o.status} onChange={(e) => updateOrderStatus(o._id, e.target.value)}>
                            <option value="pending">En attente</option>
                            <option value="confirmed">Confirmée</option>
                            <option value="completed">Complétée</option>
                            <option value="cancelled">Annulée</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ANNONCES
      ══════════════════════════════════════════════════════ */}
      {tab === "listings" && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <span className="text-sm font-medium text-gray-600">Filtrer :</span>
            <select className="input w-48 text-sm py-1.5" value={zebuFilter}
              onChange={(e) => { setZebuFilter(e.target.value); loadZebus(e.target.value); }}>
              <option value="">Tous les statuts</option>
              <option value="available">Disponibles</option>
              <option value="reserved">Réservés</option>
              <option value="sold">Vendus</option>
              <option value="pending">En attente</option>
            </select>
          </div>

          {zebusLoad ? <Spinner /> : zebus.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Package size={48} className="mx-auto mb-3 opacity-20"/>
              <p className="font-medium">Aucune annonce</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Annonce</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Vendeur</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Prix</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Vues</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Changer statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {zebus.map((z) => (
                    <tr key={z._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={z.images?.[0] || "/images/zebu/1778988471606.jpg"}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => { e.target.src = "/images/zebu/1778988471606.jpg"; }}
                          />
                          <div>
                            <p className="font-medium truncate max-w-[160px]">{z.title}</p>
                            <p className="text-xs text-gray-400">{z.breed} · {z.region}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{z.sellerInfo?.name || "—"}</p>
                        <p className="text-xs text-gray-400">{z.sellerInfo?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">Ar {fmt(z.price)}</td>
                      <td className="px-4 py-3"><span className={ZEBU_CLS[z.status]}>{ZEBU_LBL[z.status]}</span></td>
                      <td className="px-4 py-3 text-gray-500">{z.viewCount || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <select className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                          value={z.status} onChange={(e) => updateZebuStatus(z._id, e.target.value)}>
                          <option value="available">Disponible</option>
                          <option value="reserved">Réservé</option>
                          <option value="sold">Vendu</option>
                          <option value="pending">En attente</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
