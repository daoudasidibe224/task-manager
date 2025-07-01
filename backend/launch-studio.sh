#!/bin/bash

# Fonction pour vérifier si un port est disponible
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Essayer le port par défaut
PORT=5555
if ! check_port $PORT; then
    echo "✅ Port $PORT disponible, lancement de Prisma Studio..."
    npx prisma studio --port $PORT
else
    echo "⚠️  Port $PORT occupé, recherche d'un port alternatif..."
    
    # Essayer des ports alternatifs
    for PORT in 5556 5557 5558 5559 5560; do
        if ! check_port $PORT; then
            echo "✅ Port $PORT disponible, lancement de Prisma Studio..."
            npx prisma studio --port $PORT
            break
        fi
    done
    
    if check_port $PORT; then
        echo "❌ Tous les ports sont occupés. Essayez de fermer d'autres applications."
        exit 1
    fi
fi 