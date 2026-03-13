# KSEF Digital System

This repository contains:

- `Frontend`: Next.js web app
- `Backend`: Express + MongoDB API

## What is already wired up

- Login now uses the backend auth API.
- Public pages now pull live backend data for summaries, announcements, donations, and rankings.
- Admin pages now read live dashboard, categories, reports, schools, projects, judges, and publication data.
- Patron pages now read live project data and can submit projects to the backend.
- Judge pages now read live assignments and can submit scores.

## Local setup

1. Backend
   - Copy `Backend/.env.example` to `Backend/.env`
   - Start MongoDB
   - Run:

   ```bash
   cd Backend
   npm install
   npm run seed:categories
   npm run dev
   ```

2. Frontend
   - Copy `Frontend/.env.example` to `Frontend/.env.local`
   - Run:

   ```bash
   cd Frontend
   npm install
   npm run dev
   ```

3. Open:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:4000`

## Docker deploy

You can run the full stack with Docker:

```bash
docker compose up --build
```

This starts:

- MongoDB on `27017`
- Backend on `4000`
- Frontend on `3000`

## Separate-host deployment

If you deploy frontend and backend separately:

- Deploy the backend first and note its public URL.
- Set `Backend/.env` `CORS_ORIGINS` to include your frontend domain.
- Set `Frontend` `NEXT_PUBLIC_API_URL` to the backend public URL.
- Rebuild and redeploy the frontend.
