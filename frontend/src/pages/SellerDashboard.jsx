// frontend/src/pages/SellerDashboard.jsx
import { useState, useEffect } from "react";
import { zebuAPI, orderAPI } from "../services/api";
import Spinner from "../components/ui/Spinner";
import ZebuIcon from "../components/ui/ZebuIcon";
import {
  Plus, Package, DollarSign, ShoppingCart,
  Eye, Pencil, Trash2, X, CheckCircle, ImagePlus, Info
} from "lucide-react";

const MIN_IMAGES = 2;
const MAX_IMAGES = 6;

const fmt = (n) => new Intl.NumberFormat("fr-MG").format(n);

const BREEDS  = ["Zébu Malgache","Zébu Gris","Brahman","Sanga","Rana","Créole Malgache"];
const REGIONS = ["Analamanga","Vakinankaratra","Itasy","Bongolava","Haute Matsiatra","Amoron'i Mania","Atsinanana","Alaotra-Mangoro","Boeny","Sofia","Atsimo-Andrefana","Androy","Menabe","Diana","Sava"];

const ORDER_STATUS = { pending:"En attente", confirmed:"Confirmée", completed:"Complétée", cancelled:"Annulée" };
const ORDER_CLS    = { pending:"badge-yellow", confirmed:"badge-blue", completed:"badge-green", cancelled:"badge-red" };

const emptyForm = { title:"", description:"", price:"", breed:"Zébu Malgache", region:"Analamanga", sex:"male", age:"", weight:"" };

export default function SellerDashboard() {
  const [tab,    setTab]    = useState("listings");
  const [zebus,  setZebus]  = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats,  setStats]  = useState(null);
  const [loading,setLoading]= useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(emptyForm);
  // Chaque entrée : { url, file, isNew }
  // isNew=false → photo déjà sur le serveur (mode édition) — url = chemin serveur
  // isNew=true  → fichier choisi localement, pas encore uploadé — file = File, url = preview locale (blob:)
  const [images,   setImages]   = useState([]);
  const [formBusy, setFormBusy] = useState(false);
  const [uploading,setUploading]= useState(false);
  const [formMsg,  setFormMsg]  = useState("");
  const [formErr,  setFormErr]  = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [z, o, s] = await Promise.all([
        zebuAPI.getMy(), orderAPI.getReceived(), zebuAPI.getStats(),
      ]);
      setZebus(z.data.data);
      setOrders(o.data.data);
      setStats(s.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const ch = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const resetImages = () => {
    // Libérer les URLs de preview locales avant de les jeter
    images.forEach((img) => { if (img.isNew) URL.revokeObjectURL(img.url); });
    setImages([]);
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); resetImages(); setFormMsg(""); setFormErr(""); setShowForm(true); };
  const openEdit   = (z)  => {
    setEditId(z._id);
    setForm({ title: z.title, description: z.description, price: z.price, breed: z.breed,
      region: z.region, sex: z.sex, age: z.age || "", weight: z.weight || "",
    });
    setImages((z.images || []).map((url) => ({ url, file: null, isNew: false })));
    setFormMsg(""); setFormErr(""); setShowForm(true);
  };

  const handleFileSelect = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // permet de re-sélectionner le même fichier plus tard
    if (!picked.length) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) { setFormErr(`Vous avez déjà ${MAX_IMAGES} photos, le maximum autorisé.`); return; }

    const accepted = picked.slice(0, room).filter((f) => f.type.startsWith("image/"));
    const newEntries = accepted.map((file) => ({ url: URL.createObjectURL(file), file, isNew: true }));
    setImages((prev) => [...prev, ...newEntries]);
    setFormErr("");
  };

  const removeImage = (i) => {
    setImages((prev) => {
      const target = prev[i];
      if (target?.isNew) URL.revokeObjectURL(target.url);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormBusy(true); setFormMsg(""); setFormErr("");

    if (images.length < MIN_IMAGES) {
      setFormErr(`Ajoutez au moins ${MIN_IMAGES} photos de qualité pour publier votre annonce.`);
      setFormBusy(false);
      return;
    }

    try {
      // 1. Uploader les nouveaux fichiers vers le serveur (dossier du vendeur connecté)
      const existingUrls = images.filter((i) => !i.isNew).map((i) => i.url);
      const newFiles      = images.filter((i) => i.isNew).map((i) => i.file);

      let uploadedUrls = [];
      if (newFiles.length) {
        setUploading(true);
        const res = await zebuAPI.uploadImages(newFiles);
        uploadedUrls = res.data.urls;
        setUploading(false);
      }

      const finalImages = [...existingUrls, ...uploadedUrls];

      // 2. Créer/modifier l'annonce avec les URLs finales des photos
      const payload = { ...form, price: Number(form.price), images: finalImages };
      if (editId) await zebuAPI.update(editId, payload);
      else        await zebuAPI.create(payload);

      setFormMsg(editId ? "Annonce modifiée !" : "Annonce créée !");
      await load();
      setTimeout(() => { setShowForm(false); setFormMsg(""); resetImages(); }, 1500);
    } catch (e) {
      setUploading(false);
      setFormErr(e.response?.data?.message || "Erreur");
    } finally { setFormBusy(false); }
  };

  const deleteZebu = async (id) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    try { await zebuAPI.delete(id); await load(); } catch (e) { alert(e.response?.data?.message); }
  };

  const updateOrderStatus = async (id, status) => {
    try { await orderAPI.updateStatus(id, status); await load(); } catch (e) { alert(e.response?.data?.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-800">Tableau de bord</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18}/> Nouvelle annonce
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Package size={20}/>, label: "Annonces",      val: stats.totalListings,    cls: "text-primary" },
            { icon: <Eye size={20}/>,     label: "Disponibles",   val: stats.availableListings, cls: "text-green-600" },
            { icon: <ShoppingCart size={20}/>, label: "Commandes", val: stats.totalOrders,      cls: "text-blue-600" },
            { icon: <DollarSign size={20}/>,  label: "Volume",     val: `Ar ${fmt(stats.totalRevenue)}`, cls: "text-amber-600" },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <span className={s.cls}>{s.icon}</span>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="font-bold text-sm">{s.val}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {[["listings","Mes annonces"],["orders","Commandes reçues"]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium transition-colors ${tab === t ? "tab-active" : "tab-inactive"}`}>
            {l} {t === "orders" && orders.filter(o => o.status === "pending").length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {orders.filter(o => o.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Annonces */}
      {tab === "listings" && (
        zebus.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <ZebuIcon size={52} className="text-gray-300 mx-auto mb-3" />
            <p className="font-medium">Vous n'avez pas encore d'annonce</p>
            <button onClick={openCreate} className="btn-primary mt-4">Créer ma première annonce</button>
          </div>
        ) : (
          <div className="space-y-3">
            {zebus.map((z) => (
              <div key={z._id} className="card p-4 flex items-center gap-4">
                <img src={z.images?.[0] || "https://upload.wikimedia.org/wikipedia/commons/5/5c/Zebu.jpg"} alt={z.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { e.target.src = "https://upload.wikimedia.org/wikipedia/commons/5/5c/Zebu.jpg"; }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{z.title}</p>
                  <p className="text-primary font-semibold text-sm">Ar {fmt(z.price)}</p>
                  <p className="text-xs text-gray-400">{z.region} · {z.breed}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge ${z.status === "available" ? "badge-green" : z.status === "sold" ? "badge-gray" : "badge-yellow"}`}>
                    {z.status}
                  </span>
                  <button onClick={() => openEdit(z)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-500 hover:text-primary">
                    <Pencil size={15}/>
                  </button>
                  <button onClick={() => deleteZebu(z._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600">
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Commandes reçues */}
      {tab === "orders" && (
        orders.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium">Aucune commande reçue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o._id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold">{o.zebuDetails?.title || "Annonce supprimée"}</p>
                    <p className="text-primary font-bold">Ar {fmt(o.amount)}</p>
                  </div>
                  <span className={ORDER_CLS[o.status]}>{ORDER_STATUS[o.status]}</span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <p><span className="font-medium">Acheteur :</span> {o.buyerDetails?.name} ({o.buyerDetails?.phone || o.buyerDetails?.email})</p>
                  <p><span className="font-medium">Paiement :</span> {o.paymentMethod}</p>
                  {o.notes && <p><span className="font-medium">Notes :</span> {o.notes}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(o.createdAt).toLocaleDateString("fr-MG", { day:"2-digit", month:"long", year:"numeric" })}</p>
                </div>
                {o.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => updateOrderStatus(o._id, "confirmed")}
                      className="btn-primary text-sm py-1.5 flex items-center gap-1">
                      <CheckCircle size={14}/> Confirmer
                    </button>
                    <button onClick={() => updateOrderStatus(o._id, "cancelled")}
                      className="btn-outline text-sm py-1.5 text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-1">
                      <X size={14}/> Refuser
                    </button>
                  </div>
                )}
                {o.status === "confirmed" && (
                  <button onClick={() => updateOrderStatus(o._id, "completed")}
                    className="btn-primary text-sm py-1.5">
                    Marquer comme complétée
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal formulaire annonce */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); resetImages(); } }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-bold">{editId ? "Modifier l'annonce" : "Nouvelle annonce"}</h2>
              <button onClick={() => { setShowForm(false); resetImages(); }} className="p-1 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            {formMsg && <p className="text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm mb-3 flex items-center gap-2"><CheckCircle size={14}/>{formMsg}</p>}
            {formErr && <p className="text-red-700 bg-red-50 px-3 py-2 rounded-lg text-sm mb-3">{formErr}</p>}
            <form onSubmit={submitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input className="input" required value={form.title} onChange={ch("title")} placeholder="Ex: Beau Zébu Malgache robuste" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (Ar) *</label>
                  <input className="input" type="number" required min="0" value={form.price} onChange={ch("price")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Race *</label>
                  <select className="input" value={form.breed} onChange={ch("breed")}>
                    {BREEDS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Région *</label>
                  <select className="input" value={form.region} onChange={ch("region")}>
                    {REGIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexe *</label>
                  <select className="input" value={form.sex} onChange={ch("sex")}>
                    <option value="male">Mâle</option>
                    <option value="female">Femelle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge (ans)</label>
                  <input className="input" type="number" min="0" value={form.age} onChange={ch("age")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
                  <input className="input" type="number" min="0" value={form.weight} onChange={ch("weight")} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photos * <span className="font-normal text-gray-400">({images.length}/{MAX_IMAGES} — minimum {MIN_IMAGES})</span>
                  </label>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex gap-2 text-xs text-amber-800">
                    <Info size={28} className="flex-shrink-0 mt-0.5" />
                    <p>
                      Pour attirer plus d'acheteurs : utilisez des photos <strong>nettes et bien éclairées</strong> (lumière du jour),
                      montrant le <strong>zébu entier</strong> sous <strong>plusieurs angles</strong> (face, profil, arrière),
                      sur un <strong>fond dégagé</strong>. Évitez les photos floues, sombres ou prises de loin. Formats acceptés : JPG, PNG, WEBP (5 Mo max/photo).
                    </p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                    {images.map((img, i) => (
                      <div key={img.url + i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={img.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Principale</span>
                        )}
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {images.length < MAX_IMAGES && (
                      <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-primary cursor-pointer transition-colors">
                        <ImagePlus size={20} />
                        <span className="text-[10px] text-center px-1">Ajouter</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" multiple
                          className="hidden" onChange={handleFileSelect} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="input resize-none" rows={4} value={form.description} onChange={ch("description")}
                    placeholder="Décrivez l'animal : état de santé, historique, conditions…" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formBusy} className="btn-primary flex-1">
                  {formBusy ? (uploading ? "Envoi des photos…" : "Sauvegarde…") : editId ? "Modifier" : "Publier l'annonce"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetImages(); }} className="btn-outline px-6">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
