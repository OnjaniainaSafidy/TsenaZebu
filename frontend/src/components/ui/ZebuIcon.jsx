// frontend/src/components/ui/ZebuIcon.jsx
// Icône vectorielle personnalisée (tête de zébu, cornes + bosse) — remplace
// l'emoji 🐂 qui ne s'affiche pas correctement sur toutes les plateformes.
// API similaire à lucide-react : props `size` et `className`, couleur héritée
// via `currentColor` (donc pilotable avec les classes Tailwind text-*).

export default function ZebuIcon({ size = 24, className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Zébu"
      {...props}
    >
      {/* Cornes */}
      <path d="M8.5,6.5 C6,5.5 3.5,4 2.5,1.2" />
      <path d="M15.5,6.5 C18,5.5 20.5,4 21.5,1.2" />
      {/* Oreilles */}
      <path d="M7.2,7.5 C5.8,8 5.3,9.3 6,10.6" />
      <path d="M16.8,7.5 C18.2,8 18.7,9.3 18,10.6" />
      {/* Bosse */}
      <path d="M9,7.2 C10,6.4 14,6.4 15,7.2" />
      {/* Tête */}
      <path d="M8,7.5 C7,9 7,11.5 8,13.5 C9,16.5 10.3,18.5 12,18.5 C13.7,18.5 15,16.5 16,13.5 C17,11.5 17,9 16,7.5 C14.7,6.2 9.3,6.2 8,7.5 Z" />
      {/* Naseaux */}
      <circle cx="10.3" cy="15.3" r="0.55" fill="currentColor" stroke="none" />
      <circle cx="13.7" cy="15.3" r="0.55" fill="currentColor" stroke="none" />
      {/* Yeux */}
      <circle cx="9.7" cy="10.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="14.3" cy="10.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
