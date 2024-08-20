FROM node:lts-alpine AS base

WORKDIR /ls
COPY package.json package-lock.json .

CMD ["node", "dist/index.js"]

FROM node:lts-alpine AS builder
WORKDIR /ls
COPY . .
RUN npm install --omit=dev && cp -R node_modules prod_node_modules
RUN npm install && npm run build

FROM base AS copier
COPY --from=builder /ls/prod_node_modules /ls/node_modules
COPY --from=builder /ls/dist /ls/dist