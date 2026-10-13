// frontend/src/pages/Profile.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import { User, Phone, MapPin, Lock, CheckCircle } from "lucide-react";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form,  setForm]  = useState({ name: user?.name || "", phone: user?.phone || "", location: user?.location || "" });
  const [pwd,   setPwd]   = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [msg,   setMsg]   = useState({ profile: "", pwd: "" });
  const [err,   setErr]   = useState({ profile: "", pwd: "" });
  const [busy,  setBusy]  = useState({ profile: false, pwd: false });

  const ch  = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const chP = (k) => (e) => setPwd({ ...pwd,  [k]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy({ ...busy, profile: true }); setMsg({ ...msg, profile: "" }); setErr({ ...err, profile: "" });
    try {
      const res = await authAPI.updateMe(form);
      updateUser(res.data.user);
      setMsg({ ...msg, profile: "Profil mis à jour !" });
    } catch (error) {
      setErr({ ...err, profile: error.response?.data?.message || "Erreur" });
    } finally { setBusy({ ...busy, profile: false }); }
  };

  const savePwd = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) {
      setErr({ ...err, pwd: "Les mots de passe ne correspondent pas" }); return;
    }
    setBusy({ ...busy, pwd: true }); setMsg({ ...msg, pwd: "" }); setErr({ ...err, pwd: "" });
    try {
      await authAPI.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setMsg({ ...msg, pwd: "Mot de passe modifié !" });
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (error) {
      setErr({ ...err, pwd: error.response?.data?.message || "Erreur" });
    } finally { setBusy({ ...busy, pwd: false }); }
  };

  const ROLE_LABEL = { buyer: "Acheteur", seller: "Vendeur", superadmin: "Administrateur" };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-800 mb-8">Mon profil</h1>

      {/* Résumé compte */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-lg">{user?.name}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className="badge-green mt-1">{ROLE_LABEL[user?.role]}</span>
        </div>
      </div>

      {/* Formulaire profil */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><User size={18}/> Informations personnelles</h2>
        {msg.profile && <p className="text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm mb-3 flex items-center gap-2"><CheckCircle size={14}/>{msg.profile}</p>}
        {err.profile && <p className="text-red-700 bg-red-50 px-3 py-2 rounded-lg text-sm mb-3">{err.profile}</p>}
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input className="input" value={form.name} onChange={ch("name")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone size={14}/> Téléphone</label>
            <input className="input" placeholder="+261 34 00 000 00" value={form.phone} onChange={ch("phone")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin size={14}/> Région</label>
            <input className="input" placeholder="Ex: Analamanga" value={form.location} onChange={ch("location")} />
          </div>
          <button type="submit" disabled={busy.profile} className="btn-primary">
            {busy.profile ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </form>
      </div>

      {/* Changement de mot de passe */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Lock size={18}/> Changer le mot de passe</h2>
        {msg.pwd && <p className="text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm mb-3 flex items-center gap-2"><CheckCircle size={14}/>{msg.pwd}</p>}
        {err.pwd && <p className="text-red-700 bg-red-50 px-3 py-2 rounded-lg text-sm mb-3">{err.pwd}</p>}
        <form onSubmit={savePwd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
            <input className="input" type="password" value={pwd.currentPassword} onChange={chP("currentPassword")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
            <input className="input" type="password" placeholder="Min. 6 caractères" value={pwd.newPassword} onChange={chP("newPassword")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
            <input className="input" type="password" value={pwd.confirm} onChange={chP("confirm")} />
          </div>
          <button type="submit" disabled={busy.pwd} className="btn-primary">
            {busy.pwd ? "Modification…" : "Modifier le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
