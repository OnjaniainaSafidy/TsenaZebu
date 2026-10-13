// frontend/src/pages/ZebuDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { zebuAPI, orderAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/ui/Spinner";
import {
  MapPin, Tag, Weight, Calendar, Eye,
  Phone, ArrowLeft, ShoppingCart, User
} from "lucide-react";

const fmt  = (n) => new Intl.NumberFormat("fr-MG").format(n);
const PAYS = ["mobile_money","virement","especes","cheque"];
const PLABELS = { mobile_money:"Mobile Money", virement:"Virement bancaire", especes:"Espèces", cheque:"Chèque" };

const STATUS_CLS = {
  available: "badge-green", reserved: "badge-yellow",
  sold: "badge-gray", pending: "badge-blue",
};
const STATUS_LBL = {
  available:"Disponible", reserved:"Réservé",
  sold:"Vendu", pending:"En attente",
};

export default function ZebuDetail() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [zebu,   setZebu]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx,  setImgIdx]  = useState(0);

  const [order,      setOrder]      = useState({ paymentMethod: "mobile_money", notes: "" });
  const [orderBusy,  setOrderBusy]  = useState(false);
  const [orderDone,  setOrderDone]  = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    zebuAPI.getById(id)
      .then((r) => setZebu(r.data.data))
      .catch(() => navigate("/marketplace", { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

  const submitOrder = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setOrderBusy(true); setOrderError("");
    try {
      await orderAPI.create({ zebuId: id, ...order });
      setOrderDone(true);
      setZebu((z) => ({ ...z, status: "reserved" }));
    } catch (e) {
      setOrderError(e.response?.data?.message || "Erreur lors de la commande");
    } finally { setOrderBusy(false); }
  };

  if (loading) return <Spinner />;
  if (!zebu)   return null;

  const imgs      = zebu.images?.length ? zebu.images : ["https://upload.wikimedia.org/wikipedia/commons/5/5c/Zebu.jpg"];
  const isMine    = user?._id === zebu.seller?.toString();
  const canOrder  = zebu.status === "available" && !isMine;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 text-sm">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Galerie ── */}
        <div>
          <div className="rounded-2xl overflow-hidden bg-amber-50 h-80 mb-3">
            <img src={imgs[imgIdx]} alt={zebu.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = "https://upload.wikimedia.org/wikipedia/commons/5/5c/Zebu.jpg"; }} />
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imgs.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? "border-primary" : "border-transparent"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "https://upload.wikimedia.org/wikipedia/commons/5/5c/Zebu.jpg"; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Infos ── */}
        <div className="space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-serif text-2xl font-bold text-gray-800">{zebu.title}</h1>
              <span className={STATUS_CLS[zebu.status]}>{STATUS_LBL[zebu.status]}</span>
            </div>
            <p className="text-3xl font-bold text-primary mt-2">Ar {fmt(zebu.price)}</p>
          </div>

          {/* Caractéristiques */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Tag size={15}/>,      label: "Race",    val: zebu.breed },
              { icon: <User size={15}/>,     label: "Sexe",    val: zebu.sex === "male" ? "Mâle ♂" : "Femelle ♀" },
              { icon: <Calendar size={15}/>, label: "Âge",     val: zebu.age ? `${zebu.age} ans` : "—" },
              { icon: <Weight size={15}/>,   label: "Poids",   val: zebu.weight ? `${zebu.weight} kg` : "—" },
              { icon: <MapPin size={15}/>,   label: "Région",  val: zebu.region },
              { icon: <Eye size={15}/>,      label: "Vues",    val: zebu.viewCount || 0 },
            ].map((it) => (
              <div key={it.label} className="bg-amber-50 rounded-lg p-3 flex items-center gap-2">
                <span className="text-primary">{it.icon}</span>
                <div>
                  <p className="text-xs text-gray-500">{it.label}</p>
                  <p className="text-sm font-semibold">{it.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          {zebu.description && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{zebu.description}</p>
            </div>
          )}

          {/* Vendeur */}
          {zebu.sellerInfo && (
            <div className="border border-amber-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><User size={16}/> Vendeur</h3>
              <p className="font-medium">{zebu.sellerInfo.name}</p>
              {zebu.sellerInfo.phone && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Phone size={13}/> {zebu.sellerInfo.phone}
                </p>
              )}
              {zebu.sellerInfo.location && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={13}/> {zebu.sellerInfo.location}
                </p>
              )}
            </div>
          )}

          {/* Commande */}
          {canOrder && !orderDone && (
            <div className="card p-5 border-primary/30">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                <ShoppingCart size={16}/> Passer une commande
              </h3>
              {orderError && <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{orderError}</p>}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Méthode de paiement</label>
                  <select className="input text-sm"
                    value={order.paymentMethod}
                    onChange={(e) => setOrder({ ...order, paymentMethod: e.target.value })}>
                    {PAYS.map((p) => <option key={p} value={p}>{PLABELS[p]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optionnel)</label>
                  <textarea className="input text-sm resize-none" rows={3}
                    placeholder="Précisez vos conditions, lieu de livraison…"
                    value={order.notes}
                    onChange={(e) => setOrder({ ...order, notes: e.target.value })} />
                </div>
                <button onClick={submitOrder} disabled={orderBusy} className="btn-primary w-full py-2.5">
                  {orderBusy ? "Envoi…" : "Confirmer la commande"}
                </button>
              </div>
            </div>
          )}

          {orderDone && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-5 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="font-semibold">Commande envoyée avec succès !</p>
              <p className="text-sm mt-1">Le vendeur vous contactera prochainement.</p>
            </div>
          )}

          {!isAuthenticated && zebu.status === "available" && (
            <Link to="/login" className="btn-primary block text-center py-2.5">
              Connectez-vous pour commander
            </Link>
          )}
          {isMine && (
            <div className="text-center text-sm text-gray-500 bg-amber-50 rounded-lg py-3">
              C'est votre annonce — gérez-la depuis votre tableau de bord.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
