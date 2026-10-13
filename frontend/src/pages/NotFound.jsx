// frontend/src/pages/NotFound.jsx
import { Link } from "react-router-dom";
import ZebuIcon from "../components/ui/ZebuIcon";
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <ZebuIcon size={112} className="text-primary/70 mb-6" />
      <h1 className="font-serif text-4xl font-bold text-gray-800 mb-3">404</h1>
      <p className="text-gray-500 mb-6">Cette page n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn-primary px-6 py-2.5">Retour à l'accueil</Link>
    </div>
  );
}
