// frontend/src/pages/MyOrders.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import Spinner from "../components/ui/Spinner";
import ZebuIcon from "../components/ui/ZebuIcon";
import { Phone, MapPin, Calendar, CreditCard } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-MG").format(n);

const STATUS_LABEL = { pending: "En attente", confirmed: "Confirmée", completed: "Complétée", cancelled: "Annulée" };
const STATUS_CLS   = { pending: "badge-yellow", confirmed: "badge-blue", completed: "badge-green", cancelled: "badge-red" };
const PLABELS      = { mobile_money: "Mobile Money", virement: "Virement bancaire", especes: "Espèces", cheque: "Chèque" };

const HINT = {
  pending:   "En attente de confirmation par le vendeur. Contactez-le pour organiser le paiement.",
  confirmed: "Le vendeur a confirmé la commande. Finalisez le paiement selon la méthode choisie ci-dessous.",
  completed: "Commande complétée — le paiement et la remise de l'animal sont finalisés.",
  cancelled: "Cette commande a été annulée.",
};

export default function MyOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getMy()
      .then((r) => setOrders(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-800 mb-2">Mes commandes</h1>
      <p className="text-gray-500 mb-8">Retrouvez ici vos commandes et les informations pour finaliser le paiement avec le vendeur.</p>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <ZebuIcon size={52} className="text-gray-300 mx-auto mb-3" />
          <p className="font-medium">Aucune commande pour le moment</p>
          <Link to="/marketplace" className="text-primary font-semibold hover:underline text-sm mt-2 inline-block">
            Parcourir la marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o._id} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <Link to={`/zebus/${o.zebu}`} className="font-semibold hover:text-primary transition-colors">
                    {o.zebuDetails?.title || "Annonce supprimée"}
                  </Link>
                  <p className="text-primary font-bold">Ar {fmt(o.amount)}</p>
                </div>
                <span className={STATUS_CLS[o.status]}>{STATUS_LABEL[o.status]}</span>
              </div>

              <p className="text-sm text-gray-500 bg-amber-50 rounded-lg px-3 py-2 mb-3">{HINT[o.status]}</p>

              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <p className="flex items-center gap-1.5"><CreditCard size={14} /> <span className="font-medium">Méthode de paiement :</span> {PLABELS[o.paymentMethod] || o.paymentMethod}</p>
                {o.notes && <p><span className="font-medium">Notes :</span> {o.notes}</p>}
                <p className="flex items-center gap-1.5 text-xs text-gray-400"><Calendar size={13} /> {new Date(o.createdAt).toLocaleDateString("fr-MG", { day: "2-digit", month: "long", year: "numeric" })}</p>
              </div>

              {o.sellerDetails && o.status !== "cancelled" && (
                <div className="border-t border-amber-100 pt-3 text-sm">
                  <p className="font-medium text-gray-700 mb-1">Contact vendeur pour le paiement :</p>
                  <p>{o.sellerDetails.name}</p>
                  {o.sellerDetails.phone && <p className="flex items-center gap-1.5 text-gray-500"><Phone size={13} /> {o.sellerDetails.phone}</p>}
                  {o.sellerDetails.location && <p className="flex items-center gap-1.5 text-gray-500"><MapPin size={13} /> {o.sellerDetails.location}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}