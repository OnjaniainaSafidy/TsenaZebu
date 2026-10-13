// frontend/src/pages/Home.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { zebuAPI } from "../services/api";
import ZebuCard from "../components/zebu/ZebuCard";
import Spinner  from "../components/ui/Spinner";
import { ArrowRight, ShieldCheck, Star, Truck } from "lucide-react";

export default function Home() {
  const [zebus,   setZebus]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isSeller } = useAuth();

  const handleSellClick = (e) => {
    if (isAuthenticated && !isSeller) {
      e.preventDefault();
      alert("Votre compte est un compte Acheteur. Seuls les comptes Vendeur ou Admin peuvent publier des annonces — demandez à un administrateur de changer votre rôle depuis le panel Admin.");
    }
  };

  useEffect(() => {
    zebuAPI.getAll({ limit: 8, sort: "newest" })
      .then((r) => setZebus(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── Hero — vraie photo de troupeau malgache ── */}
      <section className="relative text-white overflow-hidden" style={{ minHeight: "520px" }}>
        {/* Image de fond */}
        <div className="absolute inset-0">
          <img
            src="/images/hero.jpg"
            alt="Troupeau de zébus malgaches"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 40%" }}
          />
          {/* Overlay sombre pour lisibilité du texte */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        {/* Contenu hero */}
        <div className="relative max-w-6xl mx-auto px-4 py-28 flex flex-col items-start">
          <span className="bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            🇲🇬 Marketplace Malgache
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-4 max-w-2xl">
            Achetez & vendez des zébus{" "}
            <span className="text-accent">en ligne</span>
          </h1>
          <p className="text-gray-200 text-lg md:text-xl mb-8 max-w-xl leading-relaxed">
            La première marketplace spécialisée en bovins malgaches. Des centaines d'annonces dans toutes les régions de Madagascar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/marketplace"
              className="bg-accent hover:bg-amber-600 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors flex items-center gap-2 text-lg shadow-lg"
            >
              Explorer les annonces <ArrowRight size={20} />
            </Link>
            <Link
              to={isSeller ? "/dashboard" : "/register"}
              onClick={handleSellClick}
              className="bg-white/20 border-2 border-white/60 hover:bg-white/30 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors text-lg backdrop-blur-sm"
            >
              Vendre mon zébu
            </Link>
          </div>

          {/* Petites stats */}
          <div className="flex gap-8 mt-10">
            {[
              { val: "500+", label: "Annonces" },
              { val: "22",   label: "Régions" },
              { val: "100%", label: "Malgache" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-accent">{s.val}</p>
                <p className="text-xs text-gray-300 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <ShieldCheck size={32} className="text-primary" />, title: "Annonces vérifiées",  desc: "Chaque vendeur est vérifié. Achetez en toute sécurité." },
            { icon: <Star size={32}        className="text-primary" />, title: "Zébus de qualité",   desc: "Animaux sains, suivis vétérinairement, avec certificats." },
            { icon: <Truck size={32}       className="text-primary" />, title: "Livraison possible", desc: "Organisez la livraison directement avec le vendeur." },
          ].map((f) => (
            <div key={f.title} className="text-center p-6 rounded-2xl bg-surface border border-amber-100 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4 p-3 bg-amber-50 rounded-xl w-fit mx-auto">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Annonces récentes ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-3xl font-bold text-gray-800">Annonces récentes</h2>
              <p className="text-gray-500 mt-1">Les dernières annonces publiées sur la marketplace</p>
            </div>
            <Link to="/marketplace" className="text-primary font-semibold hover:underline flex items-center gap-1.5">
              Voir tout <ArrowRight size={16} />
            </Link>
          </div>
          {loading ? <Spinner /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {zebus.map((z) => <ZebuCard key={z._id} zebu={z} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl font-bold mb-4">Vous avez des zébus à vendre ?</h2>
          <p className="text-amber-200 mb-8">Publiez votre annonce gratuitement et touchez des acheteurs dans toute Madagascar.</p>
          <Link
            to={isSeller ? "/dashboard" : "/register"}
            onClick={handleSellClick}
            className="bg-accent hover:bg-amber-600 text-white px-10 py-3.5 rounded-xl font-semibold transition-colors text-lg inline-flex items-center gap-2"
          >
            Publier une annonce <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
