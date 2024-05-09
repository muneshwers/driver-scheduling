# Driver's Schedule

## What is the Driver's Schedule

The drivers schedule is a platform where users can check the availability of drivers.
The outside view of the home page allows users only to see schedules. The admin view allows the admin to create schedules and edit or delete them.

To get started with this repo, install all dependencies from the package.json.

```bash
npm install
# or
pnpm install
# or
yarn
```

## Development

Before making changes and testing and merging into production, ensure the environment is changed in the variables in following files:

src/routes/+page.server.js
- environmentMode

src/lib/supabaseClient.js
- environ

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
