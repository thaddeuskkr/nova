FROM oven/bun:alpine AS base
WORKDIR /app

FROM base AS build

COPY . .
RUN apk update && apk add jq
RUN bun install --frozen-lockfile

RUN NOVA_VERSION=$(jq -r '.version' package.json) \
    bun run build --env=NOVA_*

FROM base AS release

WORKDIR /app

COPY --from=build /app/dist dist
COPY --from=build /app/public public

CMD [ "bun", "./dist/index.js" ]