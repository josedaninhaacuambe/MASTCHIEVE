# Mastchieve IA — Backend (NestJS)
#
# Build a partir da RAIZ do monorepo (usa npm workspaces):
#   docker build -f apps/api/Dockerfile -t mastchieve-backend .
#
# Normalmente não se corre isto directamente — o docker-compose.prod.yml
# já aponta context:"." e dockerfile:"apps/api/Dockerfile".

FROM node:22-alpine

# Prisma precisa de openssl para os motores de query no Alpine
RUN apk add --no-cache openssl

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/api apps/api
RUN npm run prisma:generate --workspace=apps/api \
 && npm run build --workspace=apps/api

WORKDIR /repo/apps/api
ENV NODE_ENV=production
EXPOSE 4301

CMD ["npm", "start"]
