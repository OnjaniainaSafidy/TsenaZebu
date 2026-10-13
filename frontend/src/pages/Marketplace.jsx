// frontend/src/pages/Marketplace.jsx
import { useState, useEffect, useCallback } from "react";
import { zebuAPI } from "../services/api";
import ZebuCard from "../components/zebu/ZebuCard";
import Spinner  from "../components/ui/Spinner";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ZebuIcon from "../components/ui/ZebuIcon";

const BREEDS  = ["Zébu Malgache","Zébu Gris","Brahman","Sanga","Rana","Créole Malgache"];
const REGIONS = ["Analamanga","Vakinankaratra","Itasy","Bongolava","Haute Matsiatra","Amoron'i Mania","Atsinanana","Alaotra-Mangoro","Boeny","Sofia","Atsimo-Andrefana","Androy","Menabe","Diana","Sava"];
const SORTS   = [{ v:"newest",    l:"Plus récentes" },{ v:"price_asc",  l:"Prix croissant" },{ v:"price_desc", l:"Prix décroissant" }];

const initFilters = { search:"", region:"", breed:"", sex:"", minPrice:"", maxPrice:"", sort:"newest" };

export default function Marketplace() {
  const [zebus,      setZebus]   = useState([]);
  const [loading,    setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total:0, pages:1 });
  const [page,       setPage]    = useState(1);
  const [filters,    setFilters] = useState(initFilters);
  const [showFilter, setShowFilter] = useState(false);

  const fetch = useCallback(async (f = filters, p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 12, ...f };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const res = await zebuAPI.getAll(params);
      setZebus(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetch(); }, [page]);

  const applyFilters = () => { setPage(1); fetch(filters, 1); setShowFilter(false); };
  const resetFilters = () => { setFilters(initFilters); setPage(1); fetch(initFilters, 1); };
  const ch = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-gray-800">Marketplace</h1>
        <p className="text-gray-500 mt-1">{pagination.total} annonce(s) disponible(s)</p>
      </div>

      {/* Barre de recherche + tri */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input className="input pl-10" placeholder="Rechercher…" value={filters.search}
            onChange={ch("search")} onKeyDown={(e) => e.key === "Enter" && applyFilters()} />
        </div>
        <select className="input w-48" value={filters.sort} onChange={(e) => { setFilters({ ...filters, sort: e.target.value }); setTimeout(applyFilters, 0); }}>
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
        <button onClick={() => setShowFilter(!showFilter)} className="btn-outline flex items-center gap-2">
          <SlidersHorizontal size={16} /> Filtres
        </button>
      </div>

      {/* Panneau filtres */}
      {showFilter && (
        <div className="card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Région</label>
            <select className="input text-sm" value={filters.region} onChange={ch("region")}>
              <option value="">Toutes</option>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Race</label>
            <select className="input text-sm" value={filters.breed} onChange={ch("breed")}>
              <option value="">Toutes</option>
              {BREEDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sexe</label>
            <select className="input text-sm" value={filters.sex} onChange={ch("sex")}>
              <option value="">Tous</option>
              <option value="male">Mâle</option>
              <option value="female">Femelle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prix min (Ar)</label>
            <input className="input text-sm" type="number" placeholder="0" value={filters.minPrice} onChange={ch("minPrice")} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prix max (Ar)</label>
            <input className="input text-sm" type="number" placeholder="10 000 000" value={filters.maxPrice} onChange={ch("maxPrice")} />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <button onClick={applyFilters} className="btn-primary text-sm py-2">Appliquer</button>
            <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
              <X size={14} /> Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* Grille */}
      {loading ? <Spinner /> : zebus.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ZebuIcon size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="font-medium">Aucune annonce trouvée</p>
          <button onClick={resetFilters} className="mt-3 text-primary hover:underline text-sm">Réinitialiser les filtres</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {zebus.map((z) => <ZebuCard key={z._id} zebu={z} />)}
          </div>
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn-outline py-1.5 px-3 text-sm disabled:opacity-40">← Précédent</button>
              {[...Array(pagination.pages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`py-1.5 px-3 rounded-lg text-sm font-medium ${page === i+1 ? "bg-primary text-white" : "text-gray-600 hover:bg-amber-50"}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage((p) => p + 1)} disabled={page === pagination.pages} className="btn-outline py-1.5 px-3 text-sm disabled:opacity-40">Suivant →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
