# The Salat server, for Fly.io. Build from the repo root:
#   fly deploy   (fly.toml points here)
FROM node:22-slim
WORKDIR /srv
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY app/package.json app/
RUN npm ci --omit=dev -w server -w shared --include-workspace-root=false
COPY shared/ shared/
COPY server/ server/
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data
EXPOSE 8080
CMD ["node", "--no-warnings", "server/src/index.js"]
