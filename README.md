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

## Netlify + Render

This repository is now prepared for:

- Netlify frontend deployment from [`netlify.toml`](./netlify.toml)
- Render backend deployment from [`render.yaml`](./render.yaml)

### Backend on Render

- Create a free MongoDB database first. MongoDB Atlas free tier is the simplest match for this backend.
- In Render, create the backend from this repo using the Blueprint in `render.yaml`, or create a Web Service manually with:
  - Root Directory: `Backend`
  - Build Command: `npm ci && npm run build`
  - Start Command: `npm start`
  - Health Check Path: `/health`
- Set:
  - `MONGODB_URI` to your Atlas connection string
  - `CORS_ORIGINS` to your Netlify site URL
  - `FRONTEND_URL` to your Netlify site URL
- `JWT_SECRET` is generated automatically by the blueprint.
- The backend now seeds missing default categories on startup, which helps free Render deployments where one-off seed jobs are not available.

### Frontend on Netlify

- Import this repo into Netlify.
- The root `netlify.toml` sets the site base directory to `Frontend`.
- Set `NEXT_PUBLIC_API_URL` in Netlify to your Render backend URL, for example `https://ksef-digi-backend.onrender.com`.
- Deploy after the backend is live.

### Free-tier notes

- Render free web services spin down after idle time, so the first request after a pause can be slow.
- Netlify and Render will each need their own environment variables configured in their dashboards.
