FROM node:22.16.0-alpine

WORKDIR /app

# Installation de pnpm et NestJS CLI
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g @nestjs/cli

# Installation des dépendances
COPY package*.json pnpm-lock.yaml ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
RUN pnpm install

# Copie du code source
COPY . .

# Exposition du port
EXPOSE 8000

# Script de démarrage avec gestion Prisma
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && pnpm run start:dev"]