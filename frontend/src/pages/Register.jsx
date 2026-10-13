// frontend/src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ZebuIcon from "../components/ui/ZebuIcon";

export default function Register() {
  const [form,  setForm]  = useState({ name: "", email: "", password: "", role: "buyer", phone: "", location: "" });
  const [error, setError] = useState("");
  const [busy,  setBusy]  = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const ch = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Inscription échouée");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <ZebuIcon size={56} className="text-primary" />
            <h1 className="font-serif text-2xl font-bold mt-3 text-gray-800">Créer un compte</h1>
            <p className="text-gray-500 mt-1">Rejoignez la communauté TsenaZebu</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={submit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
              <input className="input" placeholder="Rakoto Andrianasolo" required value={form.name} onChange={ch("name")} autoComplete="off" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input className="input" type="email" placeholder="rakoto@email.mg" required value={form.email} onChange={ch("email")} autoComplete="off" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
              <input className="input" type="password" placeholder="Min. 6 caractères" required value={form.password} onChange={ch("password")} autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Je suis…</label>
              <select className="input" value={form.role} onChange={ch("role")}>
                <option value="buyer">Acheteur — Je cherche des zébus</option>
                <option value="seller">Vendeur — Je veux vendre mes zébus</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input className="input" placeholder="+261 34 00 000 00" value={form.phone} onChange={ch("phone")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
              <input className="input" placeholder="Ex: Analamanga" value={form.location} onChange={ch("location")} />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
              {busy ? "Création…" : "Créer mon compte"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà inscrit ? <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
