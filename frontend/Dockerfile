FROM node:22.16.0-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Installation des dépendances
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install

# Copie du code source
COPY . .


# Exposition du port
EXPOSE 3000

CMD ["pnpm", "run", "dev"]