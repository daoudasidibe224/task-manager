#!/bin/bash

echo "🚀 REDÉMARRAGE ET TEST AUTOMATIQUE"
echo "==================================="

# Redémarrer les containers Docker
echo "🔄 Redémarrage des containers Docker..."
cd /Users/dahou/Documents/Projets/Mes\ projets/task-manager

# Arrêter les containers
docker-compose down

# Nettoyer les volumes et caches si nécessaire
echo "🧹 Nettoyage des caches..."
docker system prune -f --volumes

# Redémarrer les containers
echo "⚡ Démarrage des containers..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier que les services sont en cours d'exécution
echo "🔍 Vérification des services..."
docker-compose ps

# Attendre que le frontend soit prêt
echo "⏳ Attente du frontend (localhost:3000)..."
timeout 60 bash -c 'until curl -s http://localhost:3000 > /dev/null; do echo "Attente..."; sleep 5; done'

# Attendre que le backend soit prêt
echo "⏳ Attente du backend (localhost:8000)..."
timeout 60 bash -c 'until curl -s http://localhost:8000/health > /dev/null; do echo "Attente..."; sleep 5; done'

echo "✅ Services démarrés avec succès !"

# Exécuter le test Puppeteer automatique
echo "🔍 Exécution des tests automatiques..."
cd frontend
node debug-script.js

echo "🎉 TEST TERMINÉ - Vérifiez le rapport dans debug-report.json" 