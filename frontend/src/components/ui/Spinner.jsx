// frontend/src/components/ui/Spinner.jsx
export default function Spinner({ fullscreen = false }) {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-surface flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-primary font-serif text-lg">Chargement…</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
