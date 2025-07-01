# Guide d'utilisation

## Lancement de l'application

```bash
# Backend (terminal 1)
cd backend
npm run start:dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

## Accès à Prisma Studio

```bash
cd backend

# Méthode automatique (trouve un port libre)
npm run studio

# Si ça ne fonctionne pas, forcer la fermeture et relancer
npm run studio:force
```

## URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Prisma Studio: http://localhost:5555 (ou le port affiché)

## Compte de test

- Email: daouda@gmail.com
- Mot de passe: (celui que vous avez défini)

## Résolution des problèmes

### Port 5555 occupé

Le script `launch-studio.sh` trouve automatiquement un port libre entre 5555 et 5560.

### Erreurs d'authentification

Les cookies HTTPOnly sont utilisés pour la sécurité. Si vous avez des problèmes :

1. Vider les cookies du navigateur
2. Se reconnecter

### Données corrompues

Un nettoyage automatique est effectué au démarrage de l'application.
