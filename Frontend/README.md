# KSEF Frontend

Next.js frontend for the Kenya Science & Engineering Fair Digital System.

## Environment

Copy `.env.example` to `.env.local` and set the backend URL:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Local development

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

## Production build

```bash
npm run build
npm run start
```

## Deploy notes

- Set `NEXT_PUBLIC_API_URL` to your public backend URL.
- The project now builds in Next.js standalone mode, which is ready for Docker and most Node hosts.
- If you use Netlify, the config now uses `npm run build`.
