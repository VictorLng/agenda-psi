FROM node:22-alpine
# Cria node_modules já com dono "node" para o volume anônimo herdar a permissão.
RUN mkdir -p /app/node_modules && chown -R node:node /app
USER node
WORKDIR /app
