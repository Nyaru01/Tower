# Proxy Tower 🏰

Proxy Tower est un jeu de Tower Defense moderne construit avec une architecture full-stack performante. Ce projet intègre un frontend réactif et un backend de synchronisation pour sauvegarder la progression des joueurs.

## 🚀 Technologies utilisées

### Frontend
- **React 19** : Interface utilisateur réactive.
- **TypeScript** : Typage statique pour une meilleure maintenabilité.
- **Vite** : Outil de build ultra-rapide et serveur de développement.
- **Framer Motion** : Animations fluides et transitions.
- **Tailwind CSS** : Styling moderne et responsive.
- **Vite PWA** : Support Progressive Web App pour une installation sur mobile.

### Backend
- **Node.js & Express** : Serveur API pour la gestion des données.
- **Prisma ORM** : Interface fluide pour interagir avec la base de données.
- **PostgreSQL** : Base de données relationnelle (hébergée sur Railway).

---

## 🏗️ Structure du Projet

- `/src` : Code source du frontend (composants React, logique du jeu, hooks).
- `/server` : Serveur Express et configuration Prisma.
- `/server/prisma` : Schéma de la base de données (`schema.prisma`).
- `/public` : Assets statiques (images, icônes).
- `.env` : Variables d'environnement (URL de la base de données).

---

## ⚙️ Comment ça fonctionne ?

### 1. Synchronisation des données
Le jeu utilise un identifiant unique (`terminalId`) pour chaque joueur. La progression (diamants, points de talent, niveaux débloqués) est envoyée au serveur via l'API `/api/sync` et stockée dans PostgreSQL.

### 2. Niveaux Globaux
Le système permet de définir des "Official Levels" (Niveaux Officiels) qui sont stockés en base de données et accessibles à tous les joueurs. Ces niveaux sont synchronisés au démarrage du serveur.

### 3. Serveur Full-Stack
Le serveur backend ne se contente pas de fournir une API ; il sert également les fichiers statiques du frontend (dossier `dist`). Cela permet de déployer l'ensemble de l'application comme une unité unique.

---

## 🛠️ Installation et Démarrage

### Pré-requis
- Node.js (v18+)
- Une base de données PostgreSQL

### Installation
1. Installez les dépendances à la racine : `npm install`
2. Installez les dépendances du serveur : `cd server && npm install`

### Démarrage (Développement)
1. Configurez votre `.env` avec la variable `DATABASE_PUBLIC_URL`.
2. Lancez le serveur backend : `cd server && npm run dev`
3. (Optionnel) Lancez le frontend séparément : `npm run dev`

### Build pour la Production
1. Construisez le frontend : `npm run build`
2. Le serveur servira alors automatiquement le contenu de `dist`.

---

## 🏥 Santé du Système
Le serveur expose un point de terminaison `/health` permettant de vérifier l'état du backend et de la connexion à la base de données.
