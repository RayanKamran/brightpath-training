# ── Build stage ──
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/astra-apis/package.json apps/astra-apis/
COPY libs/ libs/
COPY tsconfig*.json nx.json biome.jsonc ./
RUN npm ci
COPY apps/astra-apis/ apps/astra-apis/
COPY database/seeds/ database/seeds/
RUN npx nx sync && npx nx build astra-apis

# ── Run stage ──
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/astra-apis/dist/ ./
RUN npm install --omit=dev
COPY --from=builder /app/libs/shared/data-models/package.json ./node_modules/@ids/data-models/package.json
COPY --from=builder /app/libs/shared/data-models/dist/ ./node_modules/@ids/data-models/dist/
EXPOSE 3000
CMD ["node", "main.js"]

