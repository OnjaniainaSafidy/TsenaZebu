# TsenaZebu

**Plateforme web de vente et d'achat de zébus à Madagascar.**

Application MERN (MongoDB, Express, React, Node.js) qui met en relation acheteurs et vendeurs de bovins à travers Madagascar.

## Fonctionnalités

- Création de compte et connexion (authentification JWT)
- Rôles : acheteur, vendeur et administrateur
- Publication d'annonces avec photos, prix et localisation
- Recherche et filtres dans la marketplace
- Détail d'un zébu et passage de commande
- Tableau de bord vendeur et suivi des commandes
- Espace d'administration
- Gestion du profil et changement de mot de passe

## Technologies

| Partie | Technologies |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Lucide React |
| Backend | Node.js, Express, MongoDB (driver natif), JWT, bcryptjs, Multer |

## Prérequis

- [Node.js](https://nodejs.org/) 18 ou plus
- MongoDB (local ou [MongoDB Atlas](https://www.mongodb.com/atlas))
- Git

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/OnjaniainaSafidy/TsenaZebu.git
cd TsenaZebu
```

### 2. Configurer le backend

```bash
cd backend
npm install
cp .env.example .env
```

Ouvrir `backend/.env` et remplir les valeurs :

```dotenv
PORT=5000
MONGODB_URI=mongodb://localhost:27017
DB_NAME=tsena_zebu
JWT_SECRET=une_cle_secrete_longue_et_aleatoire
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
ADMIN_PASSWORD=un_mot_de_passe_fort
```

Générer une clé JWT aléatoire :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Créer le compte administrateur

```bash
npm run seed
```

Le compte admin est créé avec l'email `admin@tsenazebu.mg` et le mot de passe défini dans `ADMIN_PASSWORD`.

### 4. Lancer le backend

```bash
npm run dev
```

L'API démarre sur http://localhost:5000

### 5. Lancer le frontend

Dans un second terminal :

```bash
cd frontend
npm install
npm run dev
```

Ouvrir http://localhost:5173

## Scripts disponibles

**Backend** (`backend/`)

| Commande | Description |
|---|---|
| `npm run dev` | Lance le serveur avec rechargement automatique (nodemon) |
| `npm start` | Lance le serveur en mode production |
| `npm run seed` | Crée le compte administrateur |
| `npm run check` | Vérifie les comptes de la base de données |

**Frontend** (`frontend/`)

| Commande | Description |
|---|---|
| `npm run dev` | Lance le serveur de développement Vite |
| `npm run build` | Génère la version de production |
| `npm run preview` | Prévisualise la version de production |

## Structure du projet

```
TsenaZebu/
├── backend/
│   ├── src/
│   │   ├── config/          # Base de données et constantes
│   │   ├── controllers/     # Logique (auth, zebu, order, admin)
│   │   ├── middlewares/     # Authentification, upload, erreurs
│   │   ├── routes/          # Routes de l'API
│   │   └── utils/           # Scripts seed et check
│   ├── uploads/zebus/       # Photos téléversées
│   └── .env.example
├── frontend/
│   ├── public/images/
│   └── src/
│       ├── components/      # Navbar, Footer, ZebuCard...
│       ├── context/         # AuthContext
│       ├── pages/           # Home, Marketplace, Login, Admin...
│       └── services/        # Appels API (api.js)
├── LICENSE
└── README.md
```

## Sécurité

- Ne jamais publier le fichier `.env` (il est ignoré par Git).
- Les mots de passe sont hachés avec bcrypt.
- Changer `JWT_SECRET` et `ADMIN_PASSWORD` avant toute mise en production.

## Auteur

**Onjaniaina Safidy RANDRIANARIMANANA**
Étudiant en télécommunications, Madagascar
Email : onjaniainasafidy21@gmail.com
GitHub : [@OnjaniainaSafidy](https://github.com/OnjaniainaSafidy)

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](./LICENSE).