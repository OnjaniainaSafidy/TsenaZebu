// frontend/src/components/layout/Footer.jsx
import { Link } from "react-router-dom";
import ZebuIcon from "../ui/ZebuIcon";
export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3"><ZebuIcon size={28} /><span className="font-serif font-bold text-xl">TsenaZebu</span></div>
          <p className="text-amber-200 text-sm">La première marketplace spécialisée en zébus malgaches. Achetez et vendez en toute confiance à travers Madagascar.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Navigation</h4>
          <ul className="space-y-1.5 text-sm text-amber-200">
            <li><Link to="/"            className="hover:text-white transition-colors">Accueil</Link></li>
            <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
            <li><Link to="/register"    className="hover:text-white transition-colors">Devenir vendeur</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <ul className="space-y-1.5 text-sm text-amber-200">
            <li>📧 contact@tsenazebu.mg</li>
            <li>📞 +261 20 00 000 00</li>
            <li>📍 Antananarivo, Madagascar</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-light text-center py-3 text-xs text-amber-300">
        © {new Date().getFullYear()} TsenaZebu — Tous droits réservés
      </div>
    </footer>
  );
}
