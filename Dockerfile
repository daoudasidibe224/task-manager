FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN npm ci && node scripts/patch-devtools.ts && node --input-type=module -e "await import('./node_modules/@nuxt/devtools/dist/chunks/module-main.mjs')"
RUN npm run db:generate && npm run build -w backend
ENV NUXT_PUBLIC_API_BASE_URL=/api
RUN npm run generate -w frontend
FROM node:24-bookworm-slim AS api-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --omit=dev --workspace=backend --include-workspace-root=false --ignore-scripts

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8012 SERVE_FRONTEND_DIRECTORY=/app/frontend/.output/public
COPY --from=api-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/backend/package.json ./backend/package.json
COPY --from=build --chown=node:node /app/backend/dist ./backend/dist
COPY --from=build --chown=node:node /app/frontend/.output/public ./frontend/.output/public
USER node
EXPOSE 8012
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "backend/dist/main.js"]
