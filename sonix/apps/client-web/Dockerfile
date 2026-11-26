# ── Build stage ──
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=http://localhost:3000/api
# Note: VITE_API_URL must include the /api path prefix (e.g. https://api.idsgcloud.ca/api)
ARG VITE_LOGTO_ENDPOINT=http://localhost:3001
ARG VITE_LOGTO_APP_ID=ba88xzy7rap9hwk9m2di7
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_LOGTO_ENDPOINT=$VITE_LOGTO_ENDPOINT
ENV VITE_LOGTO_APP_ID=$VITE_LOGTO_APP_ID

COPY package.json package-lock.json ./
COPY apps/client-web/package.json apps/client-web/
COPY libs/ libs/
COPY tsconfig*.json nx.json biome.jsonc ./
RUN npm ci
COPY apps/client-web/ apps/client-web/
RUN npx nx sync && npx nx build client-web

# ── Run stage ──
FROM nginx:alpine
COPY --from=builder /app/apps/client-web/build/client /usr/share/nginx/html
COPY apps/client-web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3004


