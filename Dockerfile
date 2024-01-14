FROM node:20.11.0-alpine3.19 as base
ENV NODE_ENV production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base as deps
ADD package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod=false

FROM base as prod-deps
COPY --from=deps /app/node_modules /app/node_modules
ADD package.json pnpm-lock.yaml .npmrc ./
RUN pnpm prune --prod --no-optional

FROM base as build
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN pnpm build

FROM base as app
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/index.mjs /app/index.mjs
EXPOSE 3000
CMD ["pnpm", "start"]
