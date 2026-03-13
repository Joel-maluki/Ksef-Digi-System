# KSEF Backend

Express + MongoDB backend for the Kenya Science & Engineering Fair Digital System.

## Environment

Copy `.env.example` to `.env` and update the values:

```bash
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/ksef-system
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
DONATION_PAYBILL_NUMBER=522522
DONATION_ACCOUNT_NUMBER=1199328480
SMS_GATEWAY_URL=
SMS_GATEWAY_TOKEN=
SMS_SENDER_ID=
TEXTBEE_BASE_URL=https://api.textbee.dev/api/v1
TEXTBEE_API_KEY=
TEXTBEE_DEVICE_ID=
```

`CORS_ORIGINS` accepts a comma-separated list, which makes it easier to support local development plus your deployed frontend URL.

If you want the system to send judge credentials by SMS, you have two supported options:

1. `TEXTBEE_API_KEY` + `TEXTBEE_DEVICE_ID`
This uses TextBee's API and free tier, but it still depends on a connected Android phone and the SIM/network charges behind that device.

2. `SMS_GATEWAY_URL`
Point this to your SMS provider or internal SMS webhook. The backend will `POST` JSON in this shape:

```json
{
  "to": "0712345678",
  "message": "SMS body",
  "senderId": "optional"
}
```

For donations, the public page records the donor phone and desired amount, then instructs the donor to pay manually via `DONATION_PAYBILL_NUMBER` and `DONATION_ACCOUNT_NUMBER`. Admin can later mark the donation as successful after verifying the transfer.

## Local development

```bash
npm install
npm run seed:categories
npm run seed:demo-users
npm run dev
```

The backend runs on `http://localhost:4000`.

## Production build

```bash
npm run build
npm run start
```

## Main routes

- `POST /api/auth/login`
- `GET /api/public/summary`
- `GET /api/public/rankings`
- `GET /api/public/announcements`
- `GET /api/publications/overview`
- `GET /api/project-judge-assignments/mine`

## Demo accounts

After running `npm run seed:demo-users`, these logins are available:

- Admin: `admin@ksef.ke` / `Admin123!`
- Patron: `patron@ngao.ac.ke` / `Patron123!`
- Judge: `judge@holaboys.ac.ke` / `Judge123!`
