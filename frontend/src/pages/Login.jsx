// frontend/src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ZebuIcon from "../components/ui/ZebuIcon";

export default function Login() {
  const [form,  setForm]  = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy,  setBusy]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Connexion échouée");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <ZebuIcon size={56} className="text-primary" />
            <h1 className="font-serif text-2xl font-bold mt-3 text-gray-800">Connexion</h1>
            <p className="text-gray-500 mt-1">Accédez à votre compte TsenaZebu</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="input" type="email" placeholder="votre@email.mg" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input className="input" type="password" placeholder="••••••••" required
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
              {busy ? "Connexion…" : "Se connecter"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Pas de compte ? <Link to="/register" className="text-primary font-medium hover:underline">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
