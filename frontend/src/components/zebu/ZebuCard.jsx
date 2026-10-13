// frontend/src/components/zebu/ZebuCard.jsx
import { Link } from "react-router-dom";
import { MapPin, Eye, Tag } from "lucide-react";

const STATUS = {
  available: { label: "Disponible", cls: "badge-green"  },
  reserved:  { label: "Réservé",    cls: "badge-yellow" },
  sold:      { label: "Vendu",      cls: "badge-gray"   },
  pending:   { label: "En attente", cls: "badge-blue"   },
};

const fmt = (n) => new Intl.NumberFormat("fr-MG").format(n);

// Image de secours locale (toujours disponible)
const FALLBACK = "/images/zebu/1778988471606.jpg";

export default function ZebuCard({ zebu }) {
  const st  = STATUS[zebu.status] || STATUS.available;
  const img = zebu.images?.[0] || FALLBACK;

  return (
    <Link to={`/zebus/${zebu._id}`} className="card group hover:shadow-md transition-shadow block">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-amber-50">
        <img
          src={img}
          alt={zebu.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            if (e.target.src !== window.location.origin + FALLBACK) {
              e.target.src = FALLBACK;
            }
          }}
        />
        <span className={`absolute top-2 right-2 ${st.cls}`}>{st.label}</span>
        {zebu.images?.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            +{zebu.images.length - 1} photos
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">{zebu.title}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <Tag size={12} /><span>{zebu.breed}</span>
          <span className="mx-1">·</span>
          <span>{zebu.sex === "male" ? "♂ Mâle" : "♀ Femelle"}</span>
          {zebu.age && <><span className="mx-1">·</span><span>{zebu.age} ans</span></>}
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
          <MapPin size={12} /><span>{zebu.region}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">Ar {fmt(zebu.price)}</span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Eye size={12} /><span>{zebu.viewCount || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
