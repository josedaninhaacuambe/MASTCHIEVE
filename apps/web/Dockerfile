# Mastchieve IA — Web (Next.js)
#
# Build a partir da RAIZ do monorepo (usa npm workspaces):
#   docker build -f apps/web/Dockerfile -t mastchieve-web \
#     --build-arg NEXT_PUBLIC_API_URL=... \
#     --build-arg NEXT_PUBLIC_WS_URL=... .
#
# As variáveis NEXT_PUBLIC_* do Next.js são embutidas no bundle em TEMPO DE
# BUILD, não em runtime — por isso entram como build args, não como env_file.
# O docker-compose.prod.yml e o deploy/deploy-docker.sh tratam de as extrair
# de apps/web/.env.production automaticamente.

FROM node:22-alpine
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

COPY apps/web apps/web
RUN npm run build --workspace=apps/web

WORKDIR /repo/apps/web
ENV NODE_ENV=production
EXPOSE 4300

CMD ["npm", "start"]
