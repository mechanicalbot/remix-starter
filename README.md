## TODO:

- [x] use pnpm
- [x] setup vite with hono
  - https://github.com/sergiodxa/remix-hono/tree/main
  - https://github.com/vitejs/vite/issues/15389
  - https://github.com/vitejs/vite/discussions/14288
- [x] setup vitest/playwright https://github.com/kiliman/remix-vite-template
- [x] setup storybook https://github.com/moishinetzer/epic-stack-with-storybook
- [x] setup eslint/prettier https://github.com/kiliman/remix-vite-template
- [x] setup tailwind
- [x] docker
- [x] add GH actions
- [x] add remix-auth and magic links
- [x] add shadcn
- [x] add drizzle
- [ ] add stripe integration https://github.com/dev-xo/stripe-stack
- [ ] add test mocks
- [ ] setup cloudflare or fly.io
- [ ] handle multi-tenancy https://github.com/offseat/epic-stack-tenant
- [ ] add prometheus metrics https://github.com/epicweb-dev/epic-stack/pull/503

## Stack

- Main stack
  - [Remix](https://remix.run/)
  - [Hono](https://hono.dev/)
  - [Vite](https://vitejs.dev/) with [Remix support](https://remix.run/docs/en/main/future/vite)
  - [Drizzle ORM](https://orm.drizzle.team/docs/get-started-sqlite)
- UI
  - [shadcn/ui](https://ui.shadcn.com/)
- Linting/formatting
  - [Prettier](https://prettier.io/)
  - [ESlint](https://eslint.org/)
- Styles
  - [PostCSS](https://postcss.org/) with [Autoprefixer](https://github.com/postcss/autoprefixer)
  - [Tailwind CSS](https://tailwindcss.com/)
- Testing
  - [Vitest](https://vitest.dev/) with unit testing and Remix routes test via [createRemixStub](https://remix.run/docs/en/main/utils/create-remix-stub)
  - [Playwright](https://playwright.dev/) E2E testing
  - [Storybook](https://storybook.js.org/) and Remix routes via [createRemixStub](https://remix.run/docs/en/main/utils/create-remix-stub)
- Deployment
  - [Docker](https://docker.com/)

## Development

Run the Hono server with Vite dev middleware:

```sh
pnpm dev
```

## Deployment

First, build your app for production:

```sh
pnpm build
```

Then run the app in production mode:

```sh
pnpm start
```
