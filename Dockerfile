FROM node:lts-alpine AS base

WORKDIR /nova
COPY package.json package-lock.json .
COPY assets/ assets/

CMD ["node", "dist/index.js"]

FROM node:lts-alpine AS builder
WORKDIR /nova
COPY . .
RUN npm install --omit=dev && cp -R node_modules prod_node_modules
RUN npm install && npm run build

FROM base AS copier
COPY --from=builder /nova/prod_node_modules /nova/node_modules
COPY --from=builder /nova/dist /nova/dist