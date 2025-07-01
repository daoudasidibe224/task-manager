#!/bin/bash

echo "🧹 Nettoyage et redémarrage de l'application..."
echo ""

# Frontend
echo "📦 Frontend - Nettoyage du cache Nuxt..."
cd frontend
npx nuxi cleanup
echo "✅ Cache nettoyé"
echo ""

# Backend
echo "📦 Backend - Redémarrage..."
cd ../backend
echo "⚠️  Assurez-vous que le backend est lancé dans un autre terminal avec:"
echo "   cd backend && npm run start:dev"
echo ""

# Frontend
echo "🚀 Lancement du frontend..."
cd ../frontend
npm run dev 