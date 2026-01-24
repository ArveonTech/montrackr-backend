# MonTrackr — Backend

Simple backend for MonTrackr (personal finance tracker). Built with Node.js and Express; connects to MongoDB and provides REST API endpoints for authentication, users, transactions, budgets, goals, subscriptions and analytics.

## Features
- User authentication (JWT)
- CRUD for transactions, budgets, goals, subscriptions
- Analytics endpoints

## Quickstart

1. Install dependencies

```bash
npm install
```

2. Environment

Create a `.env` file in the project root with at least:

```
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
# Optional for email/OTP features:
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

3. Run

```bash
npm run dev    # development (nodemon)
npm start      # production
```

## Project structure (key folders)
- `controllers/` — request handlers
- `models/` — Mongoose schemas
- `routers/` — route definitions (auth, users, transactions, budgets, goals, subscriptions, analytics)
- `middleware/` — auth, validation and other middleware
- `utils/`, `helpers/` — small utilities (date normalization, tokens, email helpers)
- `database/` — DB connection (`db.js`)

## API overview
Routes are grouped under `/api` (check `routers/`):

- `auth.routes.js` — signup, login, logout, OTP
- `users.routes.js` — user profile and settings
- `transactions.routes.js` — transaction CRUD
- `budget.routes.js` — budgets
- `goal.routes.js` — goals
- `subscriptions.routes.js` — recurring subscriptions
- `analytics.routes.js` — aggregated data endpoints

Use an API client (Postman / Insomnia) and include `Authorization: Bearer <token>` for protected routes.

## Notes
- Check `env/` and `middleware/` for environment helpers and validation details.
- Keep `JWT_SECRET` and DB credentials out of source control.

## License & Contribution
This README is a minimal starter. Add contribution guidelines, code style, tests and CI details as appropriate.
