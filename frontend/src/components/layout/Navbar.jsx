// frontend/src/components/layout/Navbar.jsx
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, X, ShoppingBag, LogOut, User, LayoutDashboard, Shield } from "lucide-react";
import ZebuIcon from "../ui/ZebuIcon";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isSeller, logout } = useAuth();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); setOpen(false); };

  const link = "text-sm font-medium text-gray-700 hover:text-primary transition-colors";
  const active = ({ isActive }) => isActive ? `${link} text-primary` : link;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <ZebuIcon size={28} className="text-primary" />
          <span className="font-serif font-bold text-primary text-xl">TsenaZebu</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/"            className={active}>Accueil</NavLink>
          <NavLink to="/marketplace" className={active}>Marketplace</NavLink>
          {isSeller  && <NavLink to="/dashboard" className={active}>Tableau de bord</NavLink>}
          {isAdmin   && <NavLink to="/admin"     className={active}>Administration</NavLink>}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-600">Bonjour, <span className="font-semibold text-primary">{user.name.split(" ")[0]}</span></span>
              <Link to="/my-orders" className="btn-outline text-sm py-1.5">Mes commandes</Link>
              <Link to="/profile" className="btn-outline text-sm py-1.5">Mon compte</Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors">
                <LogOut size={15} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn-outline text-sm py-1.5">Connexion</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5">S'inscrire</Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-amber-100 px-4 py-4 space-y-3">
          <NavLink to="/"            onClick={() => setOpen(false)} className={active}>🏠 Accueil</NavLink>
          <NavLink to="/marketplace" onClick={() => setOpen(false)} className={`${link} flex items-center gap-2`}><ShoppingBag size={16}/> Marketplace</NavLink>
          {isSeller && <NavLink to="/dashboard" onClick={() => setOpen(false)} className={`${link} flex items-center gap-2`}><LayoutDashboard size={16}/> Tableau de bord</NavLink>}
          {isAdmin  && <NavLink to="/admin"     onClick={() => setOpen(false)} className={`${link} flex items-center gap-2`}><Shield size={16}/> Administration</NavLink>}
          {isAuthenticated ? (
            <>
              <Link to="/my-orders" onClick={() => setOpen(false)} className={`${link} flex items-center gap-2`}><ShoppingBag size={16}/> Mes commandes</Link>
              <Link to="/profile" onClick={() => setOpen(false)} className={`${link} flex items-center gap-2`}><User size={16}/> Mon compte</Link>
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600 font-medium"><LogOut size={16}/> Déconnexion</button>
            </>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link to="/login"    onClick={() => setOpen(false)} className="btn-outline text-sm py-1.5 flex-1 text-center">Connexion</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary text-sm py-1.5 flex-1 text-center">S'inscrire</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
