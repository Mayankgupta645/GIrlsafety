# SafeRoute backend

This folder is a standalone Node.js service and can be deployed independently of the frontend.

## Local setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` (or the individual `DB_*` values).
3. Install dependencies with `npm install`.
4. Create the required PostGIS tables with `npm run db:setup`.
5. Optionally add the clearly labeled sample map points with `npm run db:seed-demo`.
6. Start the server with `npm start`; for development use `npm run dev`.

The service listens on `PORT` (default `5000`) and exposes `GET /` as a health check.

## Deploy as a Node web service

Configure the deployment platform with:

- **Root directory:** `backend`
- **Build/install command:** `npm install`
- **Start command:** `npm start`
- **Health-check path:** `/`

Set the environment variables from `.env.example` in the deployment dashboard. Do not commit `.env` or put database/Twilio secrets in frontend files. Use `SOS_MODE=demo` to simulate SOS calls, or configure Twilio and an emergency number before setting `SOS_MODE=twilio`.

If frontend and backend are deployed on different hosts, set `CORS_ORIGIN` to the frontend origin and set the `saferoute-api-url` meta tag in each frontend HTML page to the deployed backend API URL ending in `/api`.
